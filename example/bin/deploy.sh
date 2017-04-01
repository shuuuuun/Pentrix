#!/bin/sh

script_dir=$(cd $(dirname $0); pwd)
target_dir="example/public"

git subtree push --prefix $target_dir origin gh-pages
