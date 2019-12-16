#!/usr/bin/env bash

echo 'Creating application user(s) and db(s)'

mongo rma-server \
        --host localhost \
        --port 27017 \
        -u $MONGODB_PRIMARY_ROOT_USER \
        -p $MONGODB_ROOT_PASSWORD \
        --authenticationDatabase admin \
        --eval "db.createUser({user: 'rma-server', pwd: '$MONGODB_PASSWORD', roles:[{role:'dbOwner', db: 'rma-server'}]});"

mongo cache-db \
        --host localhost \
        --port 27017 \
        -u $MONGODB_PRIMARY_ROOT_USER \
        -p $MONGODB_ROOT_PASSWORD \
        --authenticationDatabase admin \
        --eval "db.createUser({user: 'cache-db', pwd: '$MONGODB_PASSWORD', roles:[{role:'dbOwner', db: 'cache-db'}]});"
