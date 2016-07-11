module.exports = {
    db: {
        pgsql: process.env.DATABASE_URL || 'postgres://superopus:superopus@localhost:5432/opus'
    },
    logger: {
        api: "logs/api.log",
        exception: "logs/exceptions.log"
    },
    elastic: {
        port: "9200",
        protocol: "http",
        serverIp: "localhost",
        mainIndex : "opus",
        logLevel : "trace"
    }
};