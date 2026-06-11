import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { Pool } from "pg";
import config from "./config";
const app: Application = express();
const port = config.port;

app.use(express.json());
app.use(express.urlencoded({ extended: true })); //also have the nested data

const pool = new Pool({
  connectionString:config.connection_string,
});

const initDb = async () => {
  try {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS users(
            id SERIAL PRIMARY KEY,
            name VARCHAR(20) NOT NULL,
            email VARCHAR(20) UNIQUE NOT NULL,
            password VARCHAR(20) NOT NULL,
            is_active BOOLEAN DEFAULT true,
            age INT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
            )
            `,
    );
    console.log("Database connected successfully");
  } catch (error) {
    console.log(error);
  }
};

initDb();
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Express server",
    author: "Next level",
  });
});

//Get all the users
app.get("/users", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT * FROM users
      `);
    res.status(200).json({
      sucess: true,
      message: "Users retrieved successfully",
      data: result.rows,
    });
  } catch (error: any) {
    res.status(200).json({
      sucess: false,
      message: error.message,
      error: error,
    });
  }
});

//Get single user
app.get("/users/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `
      SELECT * FROM users WHERE id=$1
      `,
      [id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        sucess: false,
        message: "User not found",
        data: {},
      });
    }

    res.status(200).json({
      sucess: true,
      message: "User retrieved successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      sucess: false,
      message: error.message,
      error: error,
    });
  }
});

//Updating single user
app.put("/users/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, password, is_active, age } = req.body;
  try {
    const result = await pool.query(
      `
      UPDATE users SET 
      name=COALESCE($1,name), 
      password=COALESCE($2,password), 
      is_active=COALESCE($3,is_active), 
      age=COALESCE($4,age) 
      WHERE id=$5 RETURNING *
      `,
      [name, password, is_active, age, id],
    );
    if (result.rows.length === 0) {
      res.status(404).json({
        sucess: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      sucess: true,
      message: "User information updated successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      sucess: false,
      message: error.message,
      error: error,
    });
  }
});

app.post("/", async (req: Request, res: Response) => {
  const { name, email, password, age } = req.body;
  try {
    const result = await pool.query(
      `
            INSERT INTO users (name, email, password,age) VALUES($1,$2,$3,$4)
            RETURNING *
        `,
      [name, email, password, age],
    );

    res.status(201).json({
      message: "Created successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    //console.log(error)
    res.status(500).json({
      message: error.message,
      error: error,
    });
  }
});


app.delete("/users/:id", async(req:Request, res:Response)=>{
  const {id}=req.params;
  try {
    const result=await pool.query(`
        DELETE FROM users WHERE id=$1
      `,[id])

     if (result.rowCount === 0) {
      res.status(404).json({
        sucess: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      sucess: true,
      message: "User deleted successfully",
      data: {},
    }); 
  } catch (error:any) {
    res.status(500).json({
      sucess: false,
      message: error.message,
      error: error,
    });
  }
})
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
