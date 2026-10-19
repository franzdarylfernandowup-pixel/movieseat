-- ====================================================================
-- MOVIESEAT — SUPABASE DATABASE SCHEMA & SEED SCRIPT
-- Single Cinema: Cinema City Hall (3 Auditoriums, 4 Movies, 12 Screenings)
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- --------------------------------------------------------------------
-- 1. PROFILES TABLE (Linked with Supabase Auth)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Automatic trigger to create a profile when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- --------------------------------------------------------------------
-- 2. AUDITORIUMS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.auditoriums (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tech TEXT NOT NULL,
  total_seats INT DEFAULT 48,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 3. MOVIES TABLE (TMDB Integration)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.movies (
  id TEXT PRIMARY KEY,
  tmdb_id INT,
  title TEXT NOT NULL,
  synopsis TEXT,
  rating TEXT NOT NULL,
  format TEXT NOT NULL,
  genre TEXT NOT NULL,
  runtime TEXT NOT NULL,
  poster_url TEXT NOT NULL,
  backdrop_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 4. SEATS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seats (
  id TEXT PRIMARY KEY,
  auditorium_id TEXT NOT NULL REFERENCES public.auditoriums(id) ON DELETE CASCADE,
  seat_code TEXT NOT NULL,
  row_letter TEXT NOT NULL,
  seat_number INT NOT NULL,
  is_vip BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 5. SHOWTIMES / SCREENINGS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.showtimes (
  id TEXT PRIMARY KEY,
  movie_id TEXT NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  auditorium_id TEXT NOT NULL REFERENCES public.auditoriums(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  time_label TEXT NOT NULL,
  price INT NOT NULL,
  is_sold_out BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 6. RESERVATIONS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  showtime_id TEXT NOT NULL REFERENCES public.showtimes(id) ON DELETE CASCADE,
  patron_name TEXT NOT NULL,
  patron_email TEXT NOT NULL,
  total_amount INT NOT NULL,
  status TEXT DEFAULT 'Active' NOT NULL, -- Active, Used, Cancelled, Expired
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 7. RESERVATION_SEATS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reservation_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  showtime_id TEXT NOT NULL REFERENCES public.showtimes(id) ON DELETE CASCADE,
  seat_id TEXT NOT NULL,
  status TEXT DEFAULT 'reserved' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Partial unique index: ensures no two active reservations take the same seat in the same showtime
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_reservation_seat 
ON public.reservation_seats(showtime_id, seat_id) 
WHERE status = 'reserved';

-- --------------------------------------------------------------------
-- 8. SEAT_HOLDS TABLE (10-minute temporary checkout hold)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seat_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  showtime_id TEXT NOT NULL REFERENCES public.showtimes(id) ON DELETE CASCADE,
  seat_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  held_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_active_seat_hold 
ON public.seat_holds(showtime_id, seat_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoriums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.showtimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seat_holds ENABLE ROW LEVEL SECURITY;

-- Public can view auditoriums, movies, seats, showtimes
CREATE POLICY "Public can view auditoriums" ON public.auditoriums FOR SELECT USING (true);
CREATE POLICY "Public can view movies" ON public.movies FOR SELECT USING (true);
CREATE POLICY "Public can view seats" ON public.seats FOR SELECT USING (true);
CREATE POLICY "Public can view showtimes" ON public.showtimes FOR SELECT USING (true);
CREATE POLICY "Public can view seat holds" ON public.seat_holds FOR SELECT USING (true);
CREATE POLICY "Public can view reserved seats" ON public.reservation_seats FOR SELECT USING (true);

-- User Profile policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Reservation policies
CREATE POLICY "Users can view own reservations" ON public.reservations 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reservations" ON public.reservations 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert reservation seats" ON public.reservation_seats 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.reservations 
    WHERE reservations.id = reservation_seats.reservation_id 
    AND reservations.user_id = auth.uid()
  )
);

-- Seat hold policies
CREATE POLICY "Users can insert own seat holds" ON public.seat_holds 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own seat holds" ON public.seat_holds 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own seat holds" ON public.seat_holds 
FOR DELETE USING (auth.uid() = user_id);

-- ====================================================================
-- SEED DATA
-- ====================================================================

-- 1. Insert Auditoriums
INSERT INTO public.auditoriums (id, name, tech, total_seats) VALUES
('cinema-1', 'Cinema 1 · Dolby Atmos', 'Dolby Atmos 7.1.4 Surround', 48),
('cinema-2', 'Cinema 2 · IMAX Laser', 'IMAX Laser 4K · 12-Channel Audio', 48),
('cinema-3', 'Cinema 3 · Standard', 'Barco 4K Laser Cinema', 48)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, tech = EXCLUDED.tech;

-- 2. Insert Movies (with TMDB IDs)
INSERT INTO public.movies (id, tmdb_id, title, synopsis, rating, format, genre, runtime, poster_url, backdrop_url) VALUES
(
  'dune-part-two',
  693134,
  'Dune: Part Two',
  'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
  'PG-13',
  'IMAX LASER 4K',
  'Science Fiction / Adventure',
  '2h 46m',
  'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
  'https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s520b42.jpg'
),
(
  'oppenheimer',
  872585,
  'Oppenheimer',
  'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
  'R-16',
  '70MM DOLBY ATMOS',
  'Drama / History',
  '3h 00m',
  'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
  'https://image.tmdb.org/t/p/w1280/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg'
),
(
  'past-lives',
  666277,
  'Past Lives',
  'Nora and Hae Sung, two deeply connected childhood friends, are separated and reunited for one fateful week in New York.',
  'PG-13',
  'A24 INDIE SELECT',
  'Romance / Drama',
  '1h 46m',
  'https://image.tmdb.org/t/p/w500/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg',
  'https://image.tmdb.org/t/p/w1280/5YZbUmjbMa3ClvSW1Wj3D6XGolb.jpg'
),
(
  'across-the-spider-verse',
  569094,
  'Spider-Man: Across the Spider-Verse',
  'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.',
  'PG',
  'DOLBY VISION 3D',
  'Animation / Action / Sci-Fi',
  '2h 20m',
  'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
  'https://image.tmdb.org/t/p/w1280/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg'
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, poster_url = EXCLUDED.poster_url;

-- 3. Insert Seats for all 3 Auditoriums (Rows A-D Standard 10 seats, Row E VIP Recliners 8 seats)
DO $$
DECLARE
  aud TEXT;
  aud_list TEXT[] := ARRAY['cinema-1', 'cinema-2', 'cinema-3'];
  r TEXT;
  row_list TEXT[] := ARRAY['A', 'B', 'C', 'D'];
  i INT;
BEGIN
  FOREACH aud IN ARRAY aud_list LOOP
    -- Standard Rows A, B, C, D (10 seats each)
    FOREACH r IN ARRAY row_list LOOP
      FOR i IN 1..10 LOOP
        INSERT INTO public.seats (id, auditorium_id, seat_code, row_letter, seat_number, is_vip)
        VALUES (aud || '-' || r || i, aud, r || i, r, i, false)
        ON CONFLICT (id) DO NOTHING;
      END LOOP;
    END LOOP;

    -- VIP Recliners Row E (8 luxury seats)
    FOR i IN 1..8 LOOP
      INSERT INTO public.seats (id, auditorium_id, seat_code, row_letter, seat_number, is_vip)
      VALUES (aud || '-E' || i, aud, 'E' || i, 'E', i, true)
      ON CONFLICT (id) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- 4. Insert Showtimes
INSERT INTO public.showtimes (id, movie_id, auditorium_id, starts_at, time_label, price, is_sold_out) VALUES
('scr-1', 'dune-part-two', 'cinema-2', now() + interval '2 hours', '1:15 PM', 480, false),
('scr-2', 'dune-part-two', 'cinema-2', now() + interval '5 hours', '4:45 PM', 480, false),
('scr-3', 'dune-part-two', 'cinema-2', now() + interval '8 hours', '8:30 PM', 520, true),
('scr-4', 'oppenheimer', 'cinema-1', now() + interval '1 hours', '12:00 PM', 420, false),
('scr-5', 'oppenheimer', 'cinema-1', now() + interval '4 hours', '3:45 PM', 420, false),
('scr-6', 'oppenheimer', 'cinema-1', now() + interval '7 hours', '7:30 PM', 450, true),
('scr-7', 'past-lives', 'cinema-3', now() + interval '3 hours', '2:00 PM', 320, false),
('scr-8', 'past-lives', 'cinema-3', now() + interval '6 hours', '5:15 PM', 320, false),
('scr-9', 'past-lives', 'cinema-3', now() + interval '9 hours', '8:00 PM', 350, false),
('scr-10', 'across-the-spider-verse', 'cinema-1', now() + interval '2 hours', '1:00 PM', 400, true),
('scr-11', 'across-the-spider-verse', 'cinema-3', now() + interval '5 hours', '4:15 PM', 340, false),
('scr-12', 'across-the-spider-verse', 'cinema-1', now() + interval '8 hours', '7:15 PM', 420, false)
ON CONFLICT (id) DO UPDATE SET time_label = EXCLUDED.time_label, price = EXCLUDED.price;
