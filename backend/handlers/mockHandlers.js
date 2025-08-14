import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: "config.env" });

// Initialize Supabase client with service role
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Start a new mock interview session
 */
export const startMockSession = async (req, res) => {
  try {
    const { userId } = req.params;
    const { topic, difficulty, company, timeLimit } = req.body;

    const validDifficulty =
      difficulty.slice(0, 1).toUpperCase() + difficulty.slice(1);

    // Validate required parameters
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameter: userId",
      });
    }

    if (!topic || !difficulty || !company || !timeLimit) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required filters: topic, difficulty, company, timeLimit",
      });
    }

    console.log(`Starting mock session for user ${userId} with filters:`, {
      topic,
      difficulty: validDifficulty,
      company,
      timeLimit,
    });

    // Generate problem using OpenAI
    const problemPrompt = `You are an AI interviewer conducting a coding interview for ${company}. 

Generate a ${validDifficulty} difficulty coding problem focused on ${topic}. The interview should last approximately ${timeLimit} minutes.

Respond in this exact JSON format:
{
  "problemTitle": "Problem name (e.g., Two Sum)",
  "problemDescription": "Clear problem statement",
  "examples": "Examples for the problem with input, output and explanation",
  "constraints": "Constraints of the problem",
  "initialMessage": "Your opening message as an interviewer introducing the problem",
  "expectedApproach": "Brief description of expected solution approach"
}

Make it realistic for a ${company} interview and appropriate for ${validDifficulty} level. 
Keep some variation in the problem you choose`;

    console.log("Generating problem with OpenAI...");
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: problemPrompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const problemData = JSON.parse(aiResponse.choices[0].message.content);
    console.log("Generated problem:", problemData.problemTitle);

    // Create initial transcript with AI's opening message and session metadata
    const initialTranscript = [
      {
        id: 0,
        sender: "system",
        message: "Session metadata",
        timestamp: new Date().toISOString(),
        type: "metadata",
        data: {
          company,
          timeLimit,
          problemDescription: problemData.problemDescription,
          constraints: problemData.constraints,
          expectedApproach: problemData.expectedApproach,
          examples: problemData.examples,
        },
      },
      {
        id: 1,
        sender: "ai",
        message: problemData.initialMessage,
        timestamp: new Date().toISOString(),
        type: "initial_problem",
      },
    ];

    // Create session record in database (only using existing schema columns)
    const { data: session, error: sessionError } = await supabase
      .from("mock_sessions")
      .insert({
        user_id: userId,
        problem_title: problemData.problemTitle,
        problem_difficulty: validDifficulty,
        topic: topic,
        transcript: initialTranscript,
        session_duration: timeLimit,
      })
      .select()
      .single();

    if (sessionError) {
      console.error("Database error creating session:", sessionError);
      return res.status(500).json({
        success: false,
        error: "Failed to create mock session",
      });
    }

    console.log(`Mock session created with ID: ${session.id}`);

    // Return session data to frontend
    res.json({
      success: true,
      sessionId: session.id,
      problemTitle: problemData.problemTitle,
      problemDescription: problemData.problemDescription,
      constraints: problemData.constraints,
      initialMessage: problemData.initialMessage,
      examples: problemData.examples,
      timeLimit: timeLimit,
      topic: topic,
      difficulty: validDifficulty,
      company: company,
    });
  } catch (error) {
    console.error("Start mock session error:", error);

    // Handle OpenAI API errors specifically
    if (error.type === "invalid_request_error") {
      return res.status(400).json({
        success: false,
        error: "Invalid request to AI service",
      });
    }

    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

/**
 * Send a message during mock interview session
 */
export const sendMockMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message, messageType = "user" } = req.body;

    // Validate required parameters
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameter: sessionId",
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Message cannot be empty",
      });
    }

    console.log(`Processing message for session ${sessionId}`);

    // Fetch existing session
    const { data: session, error: fetchError } = await supabase
      .from("mock_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (fetchError || !session) {
      console.error("Session fetch error:", fetchError);
      return res.status(404).json({
        success: false,
        error: "Mock session not found",
      });
    }

    // Get current transcript and metadata
    const currentTranscript = session.transcript || [];
    const metadataMessage = currentTranscript.find(
      (msg) => msg.type === "metadata"
    );
    const sessionData = metadataMessage?.data || {};

    // Add user message to transcript
    const nextId = Math.max(...currentTranscript.map((msg) => msg.id), 0) + 1;
    const userMessage = {
      id: nextId,
      sender: "user",
      message: message.trim(),
      timestamp: new Date().toISOString(),
      type: messageType,
    };

    const updatedTranscript = [...currentTranscript, userMessage];

    // Prepare history for AI in terms of user and ai roles
    const conversationHistory = updatedTranscript
      .filter((msg) => msg.type !== "metadata")
      .map((msg) => ({
        role: msg.sender === "ai" ? "assistant" : "user",
        content: msg.message,
      }));

    // Generate AI response using OpenAI
    const aiPrompt = `You are conducting a ${
      session.problem_difficulty
    } difficulty coding interview for ${
      sessionData.company || "a tech company"
    }. 

Current problem: "${session.problem_title}"
Topic: ${session.topic}
Expected approach: ${sessionData.expectedApproach || "Not specified"}

STRICT Interview Guidelines:
- NEVER provide examples, code snippets, or direct solutions
- NEVER mention specific algorithms (hashmap, two pointers, etc.) unless candidate mentions them first
- Ask probing questions about their thought process: "How would you approach this?"
- If stuck, use guiding questions only: "What patterns do you see?" or "What data structure might help?"
- Only discuss complexity AFTER they present a working approach
- Be encouraging but maintain professional evaluation standards
- Keep responses brief (1-2 sentences max)
- Let the candidate drive the solution discovery completely

Your role is to evaluate, not teach. Guide through questions, never through answers.`;

    console.log("Generating AI response...");
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: aiPrompt }, ...conversationHistory],
      temperature: 0.7,
      max_tokens: 300,
    });

    const aiMessage = {
      id: nextId + 1,
      sender: "ai",
      message: aiResponse.choices[0].message.content.trim(),
      timestamp: new Date().toISOString(),
      type: "response",
    };

    // Add AI response to transcript
    const finalTranscript = [...updatedTranscript, aiMessage];

    // Update session in database
    const { error: updateError } = await supabase
      .from("mock_sessions")
      .update({
        transcript: finalTranscript,
      })
      .eq("id", sessionId);

    if (updateError) {
      console.error("Database update error:", updateError);
      return res.status(500).json({
        success: false,
        error: "Failed to update session",
      });
    }

    console.log(`Message exchange completed for session ${sessionId}`);

    // Return AI response to frontend
    res.json({
      success: true,
      aiMessage: {
        id: aiMessage.id,
        message: aiMessage.message,
        timestamp: aiMessage.timestamp,
      },
      conversationLength: finalTranscript.filter(
        (msg) => msg.type !== "metadata"
      ).length,
    });
  } catch (error) {
    console.error("Send mock message error:", error);

    if (error.type === "invalid_request_error") {
      return res.status(400).json({
        success: false,
        error: "Invalid request to AI service",
      });
    }

    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const endMockSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Validate required parameters
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameter: sessionId",
      });
    }

    console.log(`Ending mock session ${sessionId}`);

    // Fetch existing session
    const { data: session, error: fetchError } = await supabase
      .from("mock_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (fetchError || !session) {
      console.error("Session fetch error:", fetchError);
      return res.status(404).json({
        success: false,
        error: "Mock session not found",
      });
    }

    // Get conversation transcript and metadata
    const transcript = session.transcript || [];
    const metadataMessage = transcript.find((msg) => msg.type === "metadata");
    const sessionData = metadataMessage?.data || {};

    // Filter out metadata and system messages for analysis
    const conversationMessages = transcript.filter(
      (msg) => msg.type !== "metadata" && msg.sender !== "system"
    );

    if (conversationMessages.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No conversation to analyze",
      });
    }

    if (
      conversationMessages.filter((msg) => msg.sender === "user").length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "No user messages to analyze",
      });
    }

    // Prepare conversation for AI analysis
    const conversationText = conversationMessages
      .map((msg) => `${msg.sender}: ${msg.message}`)
      .join("\n");

    console.log("Conversation text:", conversationText);
    // Generate feedback using OpenAI
    const feedbackPrompt = `You are evaluating a coding interview performance. Analyze this conversation and provide structured feedback.

Problem: ${session.problem_title} (${session.problem_difficulty} difficulty)
Topic: ${session.topic}
Company: ${sessionData.company || "Tech Company"}
Expected Approach: ${sessionData.expectedApproach || "Not specified"}

Conversation:
${conversationText}

Provide your evaluation in this exact JSON format:
{
  "score": <number between 0-10>,
  "feedback": "Detailed feedback on their performance, communication, and problem-solving approach",
  "missedConcepts": ["concept1", "concept2", "concept3"],
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "timeComplexity": "Assessment of their time complexity understanding",
  "spaceComplexity": "Assessment of their space complexity understanding",
  "nextSteps": "Recommended next problem or topic to practice"
}

Scoring criteria:
- 8-10: Excellent problem solving, clear communication, optimal solution
- 6-7: Good approach, minor issues or inefficiencies
- 4-5: Partial solution, some understanding but significant gaps
- 2-3: Poor approach, limited understanding, struggled significantly
- 0-1: Unable to make meaningful progress

Be constructive but honest in your evaluation.`;

    console.log("Generating feedback with OpenAI...");
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: feedbackPrompt }],
      temperature: 0.3, // Lower temperature for more consistent evaluation
      max_tokens: 1000,
    });

    const feedbackData = JSON.parse(aiResponse.choices[0].message.content);
    console.log(`Generated feedback with score: ${feedbackData.score}`);

    // Calculate session duration
    const sessionStart = new Date(session.created_at);
    const sessionEnd = new Date();
    const durationMs = sessionEnd - sessionStart;
    const durationMinutes = Math.round(durationMs / (1000 * 60));

    // Update session with final results
    const { error: updateError } = await supabase
      .from("mock_sessions")
      .update({
        score: feedbackData.score,
        feedback: feedbackData.feedback,
        missed_concepts: feedbackData.missedConcepts || [],
        session_duration: `${durationMinutes} minutes`,
      })
      .eq("id", sessionId);

    if (updateError) {
      console.error("Database update error:", updateError);
      return res.status(500).json({
        success: false,
        error: "Failed to update session with feedback",
      });
    }

    console.log(
      `Mock session ${sessionId} completed with score ${feedbackData.score}`
    );

    // Return complete scorecard to frontend
    res.json({
      success: true,
      sessionId: sessionId,
      score: feedbackData.score,
      feedback: feedbackData.feedback,
      missedConcepts: feedbackData.missedConcepts || [],
      strengths: feedbackData.strengths || [],
      improvements: feedbackData.improvements || [],
      timeComplexity: feedbackData.timeComplexity || "Not assessed",
      spaceComplexity: feedbackData.spaceComplexity || "Not assessed",
      nextSteps:
        feedbackData.nextSteps || "Continue practicing similar problems",
      sessionDuration: `${durationMinutes} minutes`,
      problemTitle: session.problem_title,
      difficulty: session.problem_difficulty,
      topic: session.topic,
    });
  } catch (error) {
    console.error("End mock session error:", error);

    // Handle OpenAI API errors specifically
    if (error.type === "invalid_request_error") {
      return res.status(400).json({
        success: false,
        error: "Invalid request to AI service",
      });
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return res.status(500).json({
        success: false,
        error: "Failed to parse AI feedback",
      });
    }

    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
