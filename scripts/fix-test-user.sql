UPDATE users SET
  "passwordHash" = '$2a$12$amOKsJFgJp.m9156y9qyD.iodft2FpsF8bJ5gw7rHE5bl9ecQ08wC',
  role = 'ADMIN',
  "centerId" = '57b1a65a-ccce-493d-b64b-84b621623048'
WHERE email = 'test@spacejam.com';
