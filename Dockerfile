FROM python:3.12-bookworm AS requirements
WORKDIR /build/
RUN pip install poetry==1.4.1
COPY poetry.lock pyproject.toml /build/
RUN poetry export -f requirements.txt --without-hashes >requirements.txt

FROM node:23-bookworm AS webbuild
RUN apt update && apt install git automake build-essential autoconf nasm -y
WORKDIR /build/
COPY ./web/package.json ./web/yarn.lock ./
SHELL ["/bin/bash", "-c"]
RUN corepack enable && rm .yarn/install-state.gz .yarn/unplugged -rfv && yarn install --inline-builds
COPY ./.git ./.git
COPY ./web/ ./
RUN yarn build

FROM python:3.12-bookworm AS app
WORKDIR /app
# Project initialization:
COPY --from=requirements /build/requirements.txt /app/
RUN pip install -r requirements.txt gunicorn uvicorn
# Copy only requirements to cache them in docker layer
COPY --from=webbuild /build/dist /app/web/dist
# Creating folders, and files for a project:
COPY sharaga_ics /app/sharaga_ics
USER 33:33
EXPOSE 80
ENV REDIS=redis://redis:6379/0
CMD gunicorn -b 0.0.0.0:80 --access-logfile '-' --forwarded-allow-ips '*' sharaga_ics:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
