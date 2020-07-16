#!/usr/bin/env bash

echo 'Creating application user(s) and db(s)'

mongo $CACHE_DB \
        --host localhost \
        --port 27017 \
        -u $MONGODB_PRIMARY_ROOT_USER \
        -p $MONGODB_ROOT_PASSWORD \
        --authenticationDatabase admin \
        --eval "db.createUser({user: '$CACHE_USER', pwd: '$CACHE_DB_PASSWORD', roles:[{role:'dbOwner', db: '$CACHE_DB'}]});"
