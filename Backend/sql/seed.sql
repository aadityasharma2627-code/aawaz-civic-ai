INSERT INTO departments (name, category) VALUES
  ('MC Roads', 'pothole'),
  ('MC Sanitation', 'garbage'),
  ('Electricity Dept', 'streetlight'),
  ('Water Supply', 'water_leak'),
  ('General Grievance Cell', 'other')
ON CONFLICT (category) DO UPDATE SET name = EXCLUDED.name;