#!/bin/bash
export PGPASSWORD=$POSTGRES_PASSWORD
psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB -f $1
