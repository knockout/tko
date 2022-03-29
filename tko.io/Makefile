FIREBASE := npx firebase

GCP_PROJECT := tko-io

serve:
	hugo server

build:
	hugo

# hugo new <SECTIONNAME>/<FILENAME>.<FORMAT>

deploy: build
	$(FIREBASE) deploy --only hosting --project $(GCP_PROJECT)
