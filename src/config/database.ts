import { Sequelize, Model, BuildOptions } from 'sequelize';
let sequelize: Sequelize;

if (process.env.NODE_ENV === 'dev') {
  sequelize = new Sequelize({
    database: process.env.DATABASE,
    dialect: 'mysql',
    host: process.env.HOST,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME
  });
} else {
  sequelize = new Sequelize({
    dialect: 'mysql',
    host: `/cloudsql/${process.env.CLOUD_SQL}`,
    password: process.env.DB_PASSWORD,
    username: process.env.DB_USERNAME,
    database: process.env.DATABASE,
    logging: undefined,
    pool: {
      max: 6,
      acquire: 100000
    },
    dialectOptions: {
      socketPath: `/cloudsql/${process.env.CLOUD_SQL}`
    }
  });
}

export { sequelize };

// Info: https://sequelize.org/master/manual/typescript.html
// as sequelize.define used in models doesnt 'return' the correct interface,
// with this it is possible to cast it to the desired interface,
// making advantage of typescript type checkings.
type signature<T> = new (values?: object, options?: BuildOptions) => T;
export type GenericStatic<T> = typeof Model & signature<T>;

