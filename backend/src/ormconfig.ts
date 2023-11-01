import {DataSource} from "typeorm";
require('dotenv').config();

const dataSource: DataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [__dirname + "/entities/*{.js,.ts}"],
    synchronize: true,
})

export default dataSource;