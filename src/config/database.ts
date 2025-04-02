import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

// console.log('process.env.RDS_DATABASE', process.env.RDS_DATABASE);
const dbName = process.env.RDS_DATABASE;
const dbUser = process.env.RDS_USERNAME;
const dbPassword = process.env.RDS_PASSWORD;
const host = process.env.RDS_HOSTNAME;


if (!dbName || !dbUser || !dbPassword) {
    throw new Error('Missing database credentials in environment variables');
}

const sequelize: Sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: host,
    port: 3306,
    dialect: 'mysql',
    define: {
        timestamps: true,
    },
    pool: {
        max: 20,
        min: 0,
        acquire: 60000,
        idle: 10000
    },
    dialectOptions: {
        connectTimeout: 90000 // Increase timeout to 20000ms or higher if needed
    },
    logging: (message) => {
        console.log('[Sequelize] ', message);
    },
});

export { sequelize };
