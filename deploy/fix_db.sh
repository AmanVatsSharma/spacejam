export PGPASSWORD=spacejam
psql -U spacejam -d spacejam -h localhost -c "TRUNCATE locations CASCADE;"
