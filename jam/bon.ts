import { GraphQLAuthService } from '../lib/index';
import express from 'express';

const app = express();

app.use('/auth', GraphQLAuthService());

app.listen(process.env.PORT || 5000, () => {
    console.log(`server is listening on ${process.env.PORT || 5000}`)
})