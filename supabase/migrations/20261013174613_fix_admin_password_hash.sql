/*
# Fix admin password hash

Updates the password_hash in admin_users to the correctly computed
PBKDF2-SHA256 password hash with 100000 iterations and
a static salt.
*/

UPDATE admin_users
SET password_hash = '100000:73656261737469616e2d73616c742d32303236:1d9e75df9c88433fd8b161afa96016ace908f10d75171b768698c47a5d37efc8'
WHERE username = 'admin';
