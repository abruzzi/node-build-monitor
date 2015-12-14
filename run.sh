#!/bin/bash

until node app/app.js
do
    echo "restarting..."
done
