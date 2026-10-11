import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.COGNITO_REGION || "ap-south-1",
});

export const dynamodb = DynamoDBDocumentClient.from(client);

export const USERS_TABLE = "EcoSproutUsers";