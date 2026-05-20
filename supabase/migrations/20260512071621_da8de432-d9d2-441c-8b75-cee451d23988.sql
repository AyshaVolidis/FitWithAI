UPDATE public.workout_sessions
SET plan_json = jsonb_set(
  plan_json,
  '{segments}',
  (
    SELECT jsonb_agg(
      CASE segment->>'video_id'
        WHEN 'OCrUbhLPHHs' THEN segment || jsonb_build_object(
          'title', 'Quick 5 Minute Warm Up',
          'video_id', 'oAPCPjnU1wA',
          'thumbnail', 'https://i.ytimg.com/vi/oAPCPjnU1wA/mqdefault.jpg'
        )
        WHEN 'Ohbu5PxVNVc' THEN segment || jsonb_build_object(
          'title', '5 Min Calm Cool Down Stretch',
          'video_id', 'inpok4MKVLM',
          'thumbnail', 'https://i.ytimg.com/vi/inpok4MKVLM/mqdefault.jpg'
        )
        WHEN 'SQE0r3rg40k' THEN segment || jsonb_build_object(
          'title', 'Full Body Dynamic Warm Up',
          'video_id', 'L_xrDAtykMI',
          'thumbnail', 'https://i.ytimg.com/vi/L_xrDAtykMI/mqdefault.jpg'
        )
        WHEN 'jdkv1S_7Krg' THEN segment || jsonb_build_object(
          'title', '5 Min Full Body Warm Up',
          'video_id', 'R0mMyV5OtcM',
          'thumbnail', 'https://i.ytimg.com/vi/R0mMyV5OtcM/mqdefault.jpg'
        )
        WHEN 'jpicy3wTWJg' THEN segment || jsonb_build_object(
          'title', '20 Min HIIT Workout',
          'video_id', 'ml6cT4AZdqI',
          'thumbnail', 'https://i.ytimg.com/vi/ml6cT4AZdqI/mqdefault.jpg'
        )
        WHEN 'MX_Sf48xlbg' THEN segment || jsonb_build_object(
          'title', 'Low Impact Cardio',
          'video_id', 'ZSt9tm3RoUU',
          'thumbnail', 'https://i.ytimg.com/vi/ZSt9tm3RoUU/mqdefault.jpg'
        )
        WHEN 'S1eY1ofb3ZY' THEN segment || jsonb_build_object(
          'title', 'Beginner Bodyweight Strength',
          'video_id', 'UBMk30rjy0o',
          'thumbnail', 'https://i.ytimg.com/vi/UBMk30rjy0o/mqdefault.jpg'
        )
        WHEN 'ZQbEAzU3D-A' THEN segment || jsonb_build_object(
          'title', 'Post Workout Stretch Routine',
          'video_id', '4pKly2JojMw',
          'thumbnail', 'https://i.ytimg.com/vi/4pKly2JojMw/mqdefault.jpg'
        )
        WHEN 'eml0X_1uLZo' THEN segment || jsonb_build_object(
          'title', 'Yoga Cool Down',
          'video_id', 'sTANio_2E0Q',
          'thumbnail', 'https://i.ytimg.com/vi/sTANio_2E0Q/mqdefault.jpg'
        )
        ELSE segment
      END
      ORDER BY ordinality
    )
    FROM jsonb_array_elements(plan_json->'segments') WITH ORDINALITY AS segments(segment, ordinality)
  )
)
WHERE status IN ('pending', 'in_progress')
AND plan_json->'segments' @? '$[*].video_id ? (@ == "OCrUbhLPHHs" || @ == "Ohbu5PxVNVc" || @ == "SQE0r3rg40k" || @ == "jdkv1S_7Krg" || @ == "jpicy3wTWJg" || @ == "MX_Sf48xlbg" || @ == "S1eY1ofb3ZY" || @ == "ZQbEAzU3D-A" || @ == "eml0X_1uLZo")';

DELETE FROM public.seed_videos
WHERE youtube_id IN (
  'OCrUbhLPHHs',
  'Ohbu5PxVNVc',
  'SQE0r3rg40k',
  'jdkv1S_7Krg',
  'jpicy3wTWJg',
  'MX_Sf48xlbg',
  'S1eY1ofb3ZY',
  'ZQbEAzU3D-A',
  'eml0X_1uLZo'
);

INSERT INTO public.seed_videos (youtube_id, title, phase, goal_tags, level_tags, equipment_tags, duration_seconds, thumbnail_url)
VALUES
  ('oAPCPjnU1wA', 'Quick 5 Minute Warm Up', 'warmup', ARRAY['general_fitness'], ARRAY['beginner','intermediate'], ARRAY['none'], 300, 'https://i.ytimg.com/vi/oAPCPjnU1wA/mqdefault.jpg'),
  ('L_xrDAtykMI', 'Full Body Dynamic Warm Up', 'warmup', ARRAY['general_fitness'], ARRAY['beginner','intermediate'], ARRAY['none'], 300, 'https://i.ytimg.com/vi/L_xrDAtykMI/mqdefault.jpg'),
  ('R0mMyV5OtcM', '5 Min Full Body Warm Up', 'warmup', ARRAY['general_fitness'], ARRAY['beginner','intermediate'], ARRAY['none'], 300, 'https://i.ytimg.com/vi/R0mMyV5OtcM/mqdefault.jpg'),
  ('ml6cT4AZdqI', '20 Min HIIT Workout', 'main', ARRAY['lose_weight','general_fitness'], ARRAY['beginner','intermediate'], ARRAY['none'], 1200, 'https://i.ytimg.com/vi/ml6cT4AZdqI/mqdefault.jpg'),
  ('ZSt9tm3RoUU', 'Low Impact Cardio', 'main', ARRAY['lose_weight','general_fitness'], ARRAY['beginner'], ARRAY['none'], 1200, 'https://i.ytimg.com/vi/ZSt9tm3RoUU/mqdefault.jpg'),
  ('UBMk30rjy0o', 'Beginner Bodyweight Strength', 'main', ARRAY['build_muscle','general_fitness'], ARRAY['beginner'], ARRAY['none'], 1500, 'https://i.ytimg.com/vi/UBMk30rjy0o/mqdefault.jpg'),
  ('4pKly2JojMw', 'Post Workout Stretch Routine', 'cooldown', ARRAY['flexibility','general_fitness'], ARRAY['beginner','intermediate'], ARRAY['none'], 300, 'https://i.ytimg.com/vi/4pKly2JojMw/mqdefault.jpg'),
  ('inpok4MKVLM', '5 Min Calm Cool Down Stretch', 'cooldown', ARRAY['flexibility','general_fitness'], ARRAY['beginner','intermediate'], ARRAY['none'], 300, 'https://i.ytimg.com/vi/inpok4MKVLM/mqdefault.jpg'),
  ('sTANio_2E0Q', 'Yoga Cool Down', 'cooldown', ARRAY['flexibility','general_fitness'], ARRAY['beginner','intermediate'], ARRAY['none'], 600, 'https://i.ytimg.com/vi/sTANio_2E0Q/mqdefault.jpg')
ON CONFLICT (youtube_id) DO UPDATE SET
  title = EXCLUDED.title,
  phase = EXCLUDED.phase,
  goal_tags = EXCLUDED.goal_tags,
  level_tags = EXCLUDED.level_tags,
  equipment_tags = EXCLUDED.equipment_tags,
  duration_seconds = EXCLUDED.duration_seconds,
  thumbnail_url = EXCLUDED.thumbnail_url;