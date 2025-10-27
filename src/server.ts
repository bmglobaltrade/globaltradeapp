import express, {Application} from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoute from './routes/authRoutes';
import { errorMiddleware } from './utils/exceptions/errorMiddleware';
import dotenv from "dotenv" ;
dotenv.config();

const app:Application = express();
const port = 3000;
app.use(cors())
app.use(helmet())
app.use(morgan('dev'))
app.use(express.json())
app.use(errorMiddleware)

app.use('/api/auth',authRoute)


// app.get('/', (req: Request, res: Response) => {
//   res.send(`Hey our backend is alive and thriving!`);
// });

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

