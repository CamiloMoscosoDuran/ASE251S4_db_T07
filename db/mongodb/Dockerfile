FROM mongo:8.0.32-noble
WORKDIR /lab
COPY bootstrap/ ./bootstrap/
COPY changes/ ./changes/
COPY metadata/ ./metadata/
COPY checks/ ./checks/
COPY run.sh ./run.sh
RUN sed -i 's/\r$//' /lab/run.sh && chmod 755 /lab/run.sh
ENTRYPOINT ["/bin/sh", "/lab/run.sh"]
