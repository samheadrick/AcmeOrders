git restore package-lock.json
npm ci



npm update qs
npm explain qs
trivy fs --scanners vuln package-lock.json

demo:

trivy fs --scanners vuln package-lock.json
npm explain qs
npm update qs
npm explain qs
trivy fs --scanners vuln package-lock.json
git diff -- package-lock.json


restore:

git restore package-lock.json
npm ci


trivy config --severity HIGH,CRITICAL k8s/deployment.yaml

run:

cd AcmeOrders
rm -f data/orders.db
npm install
npm start
