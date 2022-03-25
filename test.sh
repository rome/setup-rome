set -e;
DIFF=$(diff ./dist/index.js ./dist/index.original.js)
 if [ "$DIFF" != "" ] then
  echo "Please re-build the index.js file with 'npm run build' and commit the changed files in the 'dist' directory." >&2
  echo "$DIFF" >&2
  exit 1
fi
