-- Import Phase 1 data into public.tracker_data.
-- Replace the email below with your Supabase Auth user email, then run this script.

do $$
declare
  _user_id uuid;
begin
  select id into _user_id
  from auth.users
  where email = 'emi.parodi92@gmail.com';

  if _user_id is null then
    raise exception 'No auth user found for the configured email';
  end if;

  with input_rows(date, week, day, section, exercise, sets, reps, weight, notes) as (
    values
      (date '2026-03-20', 'W1', 'Day 1', 'WARM UP', 'Ankle Mobility (knee-to-wall)', 2, '1 min/side', 'BW', ''),
      (date '2026-03-20', 'W1', 'Day 1', 'WARM UP', 'Tibialis Raises', 3, '15', 'BW', ''),
      (date '2026-03-20', 'W1', 'Day 1', 'WARM UP', 'Iso Split Squat Hold', 2, '30s/leg', 'BW', ''),
      (date '2026-03-20', 'W1', 'Day 1', 'WARM UP', 'Single Leg Glute Bridge', 2, '12/side', 'BW', ''),
      (date '2026-03-20', 'W1', 'Day 1', 'PLYO', 'Altitude Drop', 3, '6', '25 cm', ''),
      (date '2026-03-20', 'W1', 'Day 1', 'SQUAT', 'Back Squat', 4, '6-8', '110', ''),
      (date '2026-03-20', 'W1', 'Day 1', 'CALF', 'Leg Press Calf Raise', 4, '10', '80', ''),
      (date '2026-03-20', 'W1', 'Day 1', 'CALF', 'Seated Calf Raise', 3, '12', '80', ''),
      (date '2026-03-20', 'W1', 'Day 1', 'UNI', 'Barbell Lunges', 3, '10/leg', '25', ''),
      (date '2026-03-20', 'W1', 'Day 1', 'CORE', 'Ab Wheel Rollout', 3, '10', 'BW', ''),

      (date '2026-04-29', 'W1', 'Day 1', 'SQUAT', 'Back Squat', 4, '6-8', '120', '4 sets with 8 reps, RPE 7'),
      (date '2026-04-29', 'W1', 'Day 1', 'CALF', 'Leg Press Calf Raise', 4, '10', '80', 'RPE 6/7, will add weight'),
      (date '2026-04-29', 'W1', 'Day 1', 'CALF', 'Seated Calf Raise', 3, '12', '80', 'RPE 8 on last set'),
      (date '2026-04-29', 'W1', 'Day 1', 'UNI', 'Barbell Lunges', 3, '10/leg', '45', 'RPE 8'),
      (date '2026-04-29', 'W1', 'Day 2', 'WARM UP', 'KB Halo', 2, '10', '20', ''),
      (date '2026-04-29', 'W1', 'Day 2', 'PRESS', 'Push Press', 4, '5-6', '85', ''),
      (date '2026-04-29', 'W1', 'Day 2', 'ROW', 'Pendlay Row', 4, '8', '100', ''),
      (date '2026-04-29', 'W1', 'Day 2', 'CHEST', 'Incline DB Bench', 3, '10', '35', ''),
      (date '2026-04-29', 'W1', 'Day 2', 'NECK', 'Weighted Neck Flexion', 3, '12', '20', ''),
      (date '2026-04-29', 'W1', 'Day 2', 'ARMS', 'EZ Bar Curl', 3, '10-12', '40', ''),
      (date '2026-04-29', 'W1', 'Day 2', 'ARMS', 'Skullcrushers', 3, '10-12', '40', ''),
      (date '2026-04-29', 'W1', 'Day 2', 'FINISHER', 'Lu Raises', 2, '15', '5', ''),
      (date '2026-04-29', 'W1', 'Day 3', 'HAMS', 'Trap Bar Deadlift', 4, '5-6', '160', ''),
      (date '2026-04-29', 'W1', 'Day 3', 'HINGE', 'Good Mornings', 3, '10', '60', ''),
      (date '2026-04-29', 'W1', 'Day 3', 'UNI', 'Single Leg Press', 3, '10', '80', ''),
      (date '2026-04-29', 'W1', 'Day 4', 'PRESS', 'Close Grip Bench', 4, '6-8', '100', ''),
      (date '2026-04-29', 'W1', 'Day 4', 'PULL', 'Lat Pulldown', 3, '12-15', '95', ''),
      (date '2026-04-29', 'W1', 'Day 4', 'ROW', 'Bear Stance Row', 3, '10', '35', ''),
      (date '2026-04-29', 'W1', 'Day 4', 'ARMS', 'Tricep Pushdown', 3, '14-16', '40', ''),
      (date '2026-04-29', 'W1', 'Day 4', 'ARMS', 'Hammer Curls', 3, '10-12', '20', ''),

      (date '2026-04-29', 'W2', 'Day 1', 'SQUAT', 'Back Squat', 4, '6-8', '130', ''),
      (date '2026-04-29', 'W2', 'Day 1', 'CALF', 'Leg Press Calf Raise', 4, '10', '90', ''),
      (date '2026-04-29', 'W2', 'Day 1', 'CALF', 'Seated Calf Raise', 3, '12', '90', ''),
      (date '2026-04-29', 'W2', 'Day 1', 'UNI', 'Barbell Lunges', 3, '10/leg', '50', ''),
      (date '2026-04-29', 'W2', 'Day 2', 'WARM UP', 'KB Halo', 2, '10', '20', ''),
      (date '2026-04-29', 'W2', 'Day 2', 'PRESS', 'Push Press', 4, '5-6', '90', ''),
      (date '2026-04-29', 'W2', 'Day 2', 'ROW', 'Pendlay Row', 4, '8', '100', 'RPE 8'),
      (date '2026-04-29', 'W2', 'Day 2', 'CHEST', 'Incline DB Bench', 3, '10', '35', 'RPE 7'),
      (date '2026-04-29', 'W2', 'Day 2', 'NECK', 'Weighted Neck Flexion', 3, '12', '20', ''),
      (date '2026-04-29', 'W2', 'Day 2', 'ARMS', 'EZ Bar Curl', 3, '10-12', '40', ''),
      (date '2026-04-29', 'W2', 'Day 2', 'ARMS', 'Skullcrushers', 3, '10-12', '40', ''),
      (date '2026-04-29', 'W2', 'Day 2', 'FINISHER', 'Lu Raises', 2, '15', '5', ''),
      (date '2026-04-29', 'W2', 'Day 3', 'HAMS', 'Trap Bar Deadlift', 4, '5-6', '180', 'did regular deadlift, RPE 8.5'),
      (date '2026-04-29', 'W2', 'Day 3', 'HINGE', 'Good Mornings', 3, '10', '60', ''),
      (date '2026-04-29', 'W2', 'Day 3', 'UNI', 'Single Leg Press', 3, '10', '80', ''),
      (date '2026-04-29', 'W2', 'Day 4', 'PRESS', 'Close Grip Bench', 4, '6-8', '100', 'RPE 8'),
      (date '2026-04-29', 'W2', 'Day 4', 'PULL', 'Lat Pulldown', 3, '12-15', '95', 'RPE 8'),
      (date '2026-04-29', 'W2', 'Day 4', 'ROW', 'Bear Stance Row', 3, '10', '35', ''),
      (date '2026-04-29', 'W2', 'Day 4', 'ARMS', 'Tricep Pushdown', 3, '14-16', '40', ''),
      (date '2026-04-29', 'W2', 'Day 4', 'ARMS', 'Hammer Curls', 3, '10-12', '20', ''),

      (date '2026-04-29', 'W3', 'Day 1', 'SQUAT', 'Back Squat', 4, '6-8', '140', ''),
      (date '2026-04-29', 'W3', 'Day 1', 'CALF', 'Leg Press Calf Raise', 4, '10', '100', ''),
      (date '2026-04-29', 'W3', 'Day 1', 'CALF', 'Seated Calf Raise', 3, '12', '100', ''),
      (date '2026-04-29', 'W3', 'Day 1', 'UNI', 'Barbell Lunges', 3, '10/leg', '60', ''),
      (date '2026-04-29', 'W3', 'Day 2', 'WARM UP', 'KB Halo', 2, '10', '20', ''),
      (date '2026-04-29', 'W3', 'Day 2', 'PRESS', 'Push Press', 4, '5-6', '92.5', ''),
      (date '2026-04-29', 'W3', 'Day 2', 'ROW', 'Pendlay Row', 4, '8', '105', ''),
      (date '2026-04-29', 'W3', 'Day 2', 'CHEST', 'Incline DB Bench', 3, '10', '37.5', ''),
      (date '2026-04-29', 'W3', 'Day 2', 'NECK', 'Weighted Neck Flexion', 3, '12', '20', ''),
      (date '2026-04-29', 'W3', 'Day 2', 'ARMS', 'EZ Bar Curl', 3, '10-12', '40', ''),
      (date '2026-04-29', 'W3', 'Day 2', 'ARMS', 'Skullcrushers', 3, '10-12', '40', ''),
      (date '2026-04-29', 'W3', 'Day 2', 'FINISHER', 'Lu Raises', 2, '15', '5', ''),
      (date '2026-04-29', 'W3', 'Day 3', 'HAMS', 'Trap Bar Deadlift', 4, '5-6', '180', ''),
      (date '2026-04-29', 'W3', 'Day 3', 'HINGE', 'Good Mornings', 3, '10', '60', ''),
      (date '2026-04-29', 'W3', 'Day 3', 'UNI', 'Single Leg Press', 3, '10', '100', ''),
      (date '2026-04-29', 'W3', 'Day 4', 'PRESS', 'Close Grip Bench', 4, '6-8', '100', 'RPE 8 6 reps'),
      (date '2026-04-29', 'W3', 'Day 4', 'PULL', 'Lat Pulldown', 3, '12-15', '100', ''),
      (date '2026-04-29', 'W3', 'Day 4', 'ROW', 'Bear Stance Row', 3, '10', '35', 'RPE 8'),
      (date '2026-04-29', 'W3', 'Day 4', 'ARMS', 'Tricep Pushdown', 3, '14-16', '45', ''),
      (date '2026-04-29', 'W3', 'Day 4', 'ARMS', 'Hammer Curls', 3, '10-12', '22.5', ''),

      (date '2026-04-29', 'W4', 'Day 1', 'SQUAT', 'Back Squat', 4, '6-8', '140', 'RPE 7'),
      (date '2026-04-29', 'W4', 'Day 1', 'CALF', 'Leg Press Calf Raise', 4, '10', '120', 'RPE 9'),
      (date '2026-04-29', 'W4', 'Day 1', 'CALF', 'Seated Calf Raise', 3, '12', '100', 'RPE 8'),
      (date '2026-04-29', 'W4', 'Day 1', 'UNI', 'Barbell Lunges', 3, '10/leg', '60', ''),
      (date '2026-04-29', 'W4', 'Day 2', 'WARM UP', 'KB Halo', 2, '10', '20', ''),
      (date '2026-04-29', 'W4', 'Day 2', 'PRESS', 'Push Press', 4, '5-6', '95', ''),
      (date '2026-04-29', 'W4', 'Day 2', 'ROW', 'Pendlay Row', 4, '8', '107.5', ''),
      (date '2026-04-29', 'W4', 'Day 2', 'CHEST', 'Incline DB Bench', 3, '10', '37.5', 'RPE 7'),
      (date '2026-04-29', 'W4', 'Day 2', 'NECK', 'Weighted Neck Flexion', 3, '12', '20', ''),
      (date '2026-04-29', 'W4', 'Day 2', 'ARMS', 'EZ Bar Curl', 3, '10-12', '40', ''),
      (date '2026-04-29', 'W4', 'Day 2', 'ARMS', 'Skullcrushers', 3, '10-12', '40', ''),
      (date '2026-04-29', 'W4', 'Day 2', 'FINISHER', 'Lu Raises', 2, '15', '5', ''),
      (date '2026-04-29', 'W4', 'Day 3', 'HAMS', 'Trap Bar Deadlift', 4, '5-6', '180', 'RPE 8 fast'),
      (date '2026-04-29', 'W4', 'Day 3', 'HINGE', 'Good Mornings', 3, '10', '60', ''),
      (date '2026-04-29', 'W4', 'Day 3', 'UNI', 'Single Leg Press', 3, '10', '100', 'RPE 8'),
      (date '2026-04-29', 'W4', 'Day 4', 'PRESS', 'Close Grip Bench', 4, '6-8', '100', 'RPE 8 fast'),
      (date '2026-04-29', 'W4', 'Day 4', 'PULL', 'Lat Pulldown', 3, '12-15', '100', 'RPE 7'),
      (date '2026-04-29', 'W4', 'Day 4', 'ROW', 'Bear Stance Row', 3, '10', '35', 'RPE 6'),
      (date '2026-04-29', 'W4', 'Day 4', 'ARMS', 'Tricep Pushdown', 3, '14-16', '45', 'RPE 8'),
      (date '2026-04-29', 'W4', 'Day 4', 'ARMS', 'Hammer Curls', 3, '10-12', '25', 'RPE 8')
  ),
  normalized as (
    select distinct on (day, exercise, week)
      date,
      week,
      day,
      section,
      exercise,
      sets,
      reps,
      case when upper(weight) = 'BW' then '' else weight end as weight,
      case when upper(weight) = 'BW' then 'bw' else '' end as type,
      notes
    from input_rows
    order by day, exercise, week, date desc
  )
  insert into public.tracker_data (
    user_id, date, week, day, section, exercise, sets, reps, weight, type, notes, updated_at
  )
  select
    _user_id,
    date,
    week,
    day,
    section,
    exercise,
    sets,
    reps,
    weight,
    type,
    notes,
    now()
  from normalized
  on conflict (user_id, day, exercise, week) do update
  set
    date = excluded.date,
    section = excluded.section,
    sets = excluded.sets,
    reps = excluded.reps,
    weight = excluded.weight,
    type = excluded.type,
    notes = excluded.notes,
    updated_at = excluded.updated_at;
end $$;
