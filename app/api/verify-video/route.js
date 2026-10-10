import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

const MAX_VIDEO_SIZE = 15 * 1024 * 1024;

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "Gemini API key is missing." },
        { status: 500 }
      );
    }

    const formData = await request.formData();

    const video = formData.get("video");
    const activity = formData.get("activity");

    if (!video || typeof video.arrayBuffer !== "function") {
      return Response.json(
        { error: "Please upload a video." },
        { status: 400 }
      );
    }

    if (!activity || typeof activity !== "string") {
      return Response.json(
        { error: "Activity name is required." },
        { status: 400 }
      );
    }

    if (!video.type.startsWith("video/")) {
      return Response.json(
        { error: "Only video files are allowed." },
        { status: 400 }
      );
    }

    if (video.size > MAX_VIDEO_SIZE) {
      return Response.json(
        { error: "Video must be smaller than 15 MB." },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const videoBuffer = Buffer.from(await video.arrayBuffer());

    const uploadedFile = await ai.files.upload({
      file: new Blob([videoBuffer], { type: video.type }),
      config: {
        mimeType: video.type,
      },
    });

    let processedFile = uploadedFile;

    for (let attempt = 0; attempt < 30; attempt++) {
      if (processedFile.state === "ACTIVE") {
        break;
      }

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
        { error: "Video processing timed out. Try a shorter video." },
        { status: 504 }
      );
    }

    const prompt = `
You are the video verification AI for EcoSprout,
an environmental sustainability application.

The user claims to have completed this activity:
"${activity}"

Analyze the uploaded video carefully.

Check:
1. Is a real-looking person visible?
2. Is the claimed environmental activity visibly happening?
3. Are the important action steps visible?
4. Are there suspicious visual inconsistencies or obvious animation?

Important:
You cannot reliably prove whether a video is AI-generated.
Do not claim certainty about authenticity.

Return ONLY valid JSON with this structure:

{
  "personDetected": true,
  "activityDetected": true,
  "stepsVisible": true,
  "suspicious": false,
  "status": "APPROVED",
  "reason": "Short explanation"
}

Rules:
- APPROVED only if the claimed activity is clearly demonstrated.
- REJECTED if the claimed activity is clearly not demonstrated.
- NEEDS_REVIEW if evidence is unclear or suspicious.
- Do not approve based only on a person standing near the activity.
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

    return Response.json({
      success: true,
      verification,
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