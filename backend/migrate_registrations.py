import sqlite3

conn = sqlite3.connect('occasio.db')
c = conn.cursor()
cols = [row[1] for row in c.execute('PRAGMA table_info(registrations)').fetchall()]
print('Existing cols in registrations:', cols)

if 'payment_status' not in cols:
    c.execute("ALTER TABLE registrations ADD COLUMN payment_status VARCHAR(50) DEFAULT 'unpaid'")
    print('Added payment_status column')
if 'payment_ref' not in cols:
    c.execute("ALTER TABLE registrations ADD COLUMN payment_ref VARCHAR(100)")
    print('Added payment_ref column')

conn.commit()
conn.close()
print('Registrations migration complete!')
