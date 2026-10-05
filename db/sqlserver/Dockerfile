FROM ubuntu:22.04
RUN apt-get update && apt-get install -y curl apt-transport-https gnupg \
    && curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - \
    && curl https://packages.microsoft.com/config/ubuntu/22.04/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y mssql-tools18 \
    && rm -rf /var/lib/apt/lists/*
ENV PATH="$PATH:/opt/mssql-tools18/bin"
WORKDIR /lab
COPY bootstrap/ ./bootstrap/
COPY changes/ ./changes/
COPY metadata/ ./metadata/
COPY checks/ ./checks/
COPY run.sh ./run.sh
RUN sed -i 's/\r$//' /lab/run.sh && chmod 755 /lab/run.sh
ENTRYPOINT ["/bin/sh", "/lab/run.sh"]
