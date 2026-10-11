import { GoogleGenAI } from "@google/genai";
import { createHash } from "node:crypto";
import { auth } from "../../../auth";
import {
  TransactWriteCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  dynamodb,
  USERS_TABLE,
  VERIFICATIONS_TABLE,
} from "../../../lib/dynamodb";

export const runtime = "nodejs";

const MAX_VIDEO_SIZE = 5 * 1024 * 1024;

const ACTIVITY_POINTS = {
  "Collect & dispose 10 litter pieces": 20,
  "Recycle 1 kg waste": 40,
  "Plant a tree": 100,
  "Care for a planted tree · 30 days": 150,
  "Cycle / walk 5 km": 30,
  "Use public transport · 10 km": 25,
  "Save electricity for a day": 10,
  "Save water / report a leak": 20,
  "Donate/recycle old clothes": 50,
  "Participate in cleanup drive": 100,
  "Plastic-free day": 15,
  "Properly recycle e-waste": 75,
};

export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json(
        { success: false, error: "Please log in first." },
        { status: 401 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { success: false, error: "Gemini API key is missing." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const video = formData.get("video");
    const activity = formData.get("activity");

    if (!video || typeof video.arrayBuffer !== "function") {
      return Response.json(
        { success: false, error: "Please upload a video." },
        { status: 400 }
      );
    }

    if (
      typeof activity !== "string" ||
      !Object.prototype.hasOwnProperty.call(ACTIVITY_POINTS, activity)
    ) {
      return Response.json(
        { success: false, error: "Invalid activity selected." },
        { status: 400 }
      );
    }

    if (!video.type.startsWith("video/")) {
      return Response.json(
        { success: false, error: "Only video files are allowed." },
        { status: 400 }
      );
    }

    if (video.size === 0 || video.size > MAX_VIDEO_SIZE) {
      return Response.json(
        { success: false, error: "Video must be smaller than 5 MB." },
        { status: 400 }
      );
    }

    const videoBuffer = Buffer.from(await video.arrayBuffer());

    const videoHash = createHash("sha256")
      .update(videoBuffer)
      .digest("hex");

    const existingVerification = await dynamodb.send(
      new GetCommand({
        TableName: VERIFICATIONS_TABLE,
        Key: { videoHash },
      })
    );

    if (existingVerification.Item) {
      return Response.json(
        {
          success: false,
          error: "This video has already been submitted.",
        },
        { status: 409 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const uploadedFile = await ai.files.upload({
      file: new Blob([videoBuffer], { type: video.type }),
      config: { mimeType: video.type },
    });

    let processedFile = uploadedFile;

    for (let attempt = 0; attempt < 30; attempt++) {
      if (processedFile.state === "ACTIVE") break;

      if (processedFile.state === "FAILED") {
        throw new Error("Gemini video processing failed.");
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));

      processedFile = await ai.files.get({
        name: uploadedFile.name,
      });
    }

    if (processedFile.state !== "ACTIVE") {
      return Response.json(
        {
          success: false,
          error: "Video processing timed out. Try a shorter video.",
        },
        { status: 504 }
      );
    }

    const prompt = `
You are the AI video verifier for EcoSprout.

The user claims to have completed:
"${activity}"

Analyze the uploaded video carefully.

Return ONLY valid JSON:

{
  "personDetected": true,
  "activityDetected": true,
  "stepsVisible": true,
  "suspicious": false,
  "status": "APPROVED",
  "reason": "Short explanation"
}

Rules:
- APPROVED only if the environmental activity is clearly performed.
- REJECTED if the activity is clearly not performed.
- NEEDS_REVIEW if evidence is insufficient or suspicious.
- Do not approve merely because a person is standing nearby.
- You cannot reliably prove whether a video is AI-generated.
`;

    const result = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              fileData: {
                mimeType: processedFile.mimeType,
                fileUri: processedFile.uri,
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const verification = JSON.parse(result.text);

    const approved =
      verification.status === "APPROVED" &&
      verification.personDetected === true &&
      verification.activityDetected === true &&
      verification.stepsVisible === true &&
      verification.suspicious === false;

    if (!approved) {
      return Response.json({
        success: true,
        verification,
        pointsAwarded: 0,
      });
    }

    const userId = session.user.id;
    const pointsAwarded = ACTIVITY_POINTS[activity];

    await dynamodb.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: VERIFICATIONS_TABLE,
              Item: {
                videoHash,
                userId,
                activity,
                pointsAwarded,
                status: "APPROVED",
                verifiedAt: new Date().toISOString(),
              },
              ConditionExpression:
                "attribute_not_exists(videoHash)",
            },
          },
          {
            Update: {
              TableName: USERS_TABLE,
              Key: { userId },
              UpdateExpression:
                "SET points = if_not_exists(points, :zero) + :points",
              ConditionExpression:
                "attribute_exists(userId)",
              ExpressionAttributeValues: {
                ":zero": 0,
                ":points": pointsAwarded,
              },
            },
          },
        ],
      })
    );

    return Response.json({
      success: true,
      verification,
      pointsAwarded,
    });
  } catch (error) {
    console.error("Video verification error:", error);

    return Response.json(
      {
        success: false,
        error: "Video verification failed. Please try again.",
      },
      { status: 500 }
    );
  }
}