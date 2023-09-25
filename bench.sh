URL=localhost:9999
npx autocannon $URL -m POST \
    --warmup [-c 1 -d 3] \
    --connection 500 \
    --pipeline 10 \
    --renderStatusCode
