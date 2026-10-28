import sqlite3

conn = sqlite3.connect('occasio.db')
c = conn.cursor()
cols = [row[1] for row in c.execute('PRAGMA table_info(users)').fetchall()]
print('Existing cols in users:', cols)

if 'role' not in cols:
    c.execute("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'admin'")
    print('Added role column')
if 'college_name' not in cols:
    c.execute("ALTER TABLE users ADD COLUMN college_name VARCHAR(255) DEFAULT 'Indian Institute of Technology'")
    print('Added college_name column')
if 'department' not in cols:
    c.execute("ALTER TABLE users ADD COLUMN department VARCHAR(255) DEFAULT 'Computer Science'")
    print('Added department column')

conn.commit()
conn.close()
print('Migration complete!')
