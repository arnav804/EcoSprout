import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.COGNITO_REGION || "ap-south-1",
});

export const dynamodb = DynamoDBDocumentClient.from(client);

// Existing user profiles table
export const USERS_TABLE = "EcoSproutUsers";

// AI video verification records table
export const VERIFICATIONS_TABLE = "EcoSproutVerifications";