require('dotenv').config();
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import Routers from './routes';
import verifyToken from './middleware/jwt';

const app = express();
const port = process.env.PORT || 5000;
const prefix = '/process-api';

app.use(morgan('dev'));
app.use(express.json({limit: '50mb'}));
app.use(cors());

// public route for CRON job
app.use(prefix, Routers.PublicRouter);

// COMMERCE REPORTS ROUTE
app.use(prefix, Routers.ExportCommerceRouter);

// jwt middleware
app.use(verifyToken);

app.use(prefix, Routers.RetailRouter);
app.use(prefix, Routers.ExportsRouter);
app.use(prefix, Routers.MonitorRouter);
app.use(prefix, Routers.NormativesRouter);
app.use(prefix, Routers.PushNotificationsRouter);
app.use(prefix, Routers.CouponsRouter);

app.listen(port, () => {
  console.log('Listened port:', port);
});
