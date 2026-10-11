import { NextResponse } from "next/server";
import { auth } from "../../../auth";

import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

import { dynamodb, USERS_TABLE } from "../../../lib/dynamodb";

export const runtime = "nodejs";

export async function GET() {
  try {
    // 1. Check logged-in user
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please log in first." },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. Find user in DynamoDB
    const result = await dynamodb.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { userId },
      })
    );

    // 3. Return existing profile
    if (result.Item) {
      return NextResponse.json({
        success: true,
        profile: result.Item,
      });
    }

    // 4. Create profile for new user
    const newProfile = {
      userId,
      email: session.user.email || "",
      name: session.user.name || "EcoSprout User",
      points: 0,
      streak: 0,
      trees: 0,
      badges: 0,
      createdAt: new Date().toISOString(),
    };

    await dynamodb.send(
      new PutCommand({
        TableName: USERS_TABLE,
        Item: newProfile,
        ConditionExpression: "attribute_not_exists(userId)",
      })
    );

    return NextResponse.json({
      success: true,
      profile: newProfile,
    });
  } catch (error) {
    console.error("Profile API error:", error);

    return NextResponse.json(
      { error: "Unable to load profile." },
      { status: 500 }
    );
  }
}