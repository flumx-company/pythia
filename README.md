# Pythia

### Install and run
```bash
# Running on Node.js 10
docker-compose up -d
npm i
npm run dev
```

### Commands
```bash
# make Postgres dump in Docker container
docker exec $CONTAINER_ID pg_dump -U postgres -t $TABLE_NAME metabot > dump.sql
# restore Postgres in Docker container
cat dump.sql | docker exec -i $CONTAINER_ID psql -U postgres metabot
```
