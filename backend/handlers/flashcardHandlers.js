import multer from "multer";
import pdfParse from "pdf-parse";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import PDFDocument from "pdfkit";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
});

// Middleware function in typical format
export const uploadMiddleware = upload.single("pdf");

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Upload and process PDF to generate flashcards
export const uploadAndProcessPDF = async (req, res) => {
  try {
    const { userId } = req.params;
    const file = req.file; // Can do req.file because of the upload middleware

    if (!file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    console.log(`Processing PDF: ${file.originalname} for user: ${userId}`);

    // Extract text from PDF
    const pdfData = await pdfParse(file.buffer); // pdfParse is a library that extracts text from PDFs
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim().length < 50) {
      return res
        .status(400)
        .json({ error: "PDF contains insufficient text content" });
    }

    // Split text into chunks for batch processing
    const chunkSize = 2000; // Safe chunk size for AI processing
    const textChunks = [];

    for (let i = 0; i < extractedText.length; i += chunkSize) {
      const chunk = extractedText.substring(i, i + chunkSize);
      if (chunk.trim().length > 100) {
        // Only process meaningful chunks
        textChunks.push(chunk);
      }
    }

    console.log(`Processing ${textChunks.length} text chunks`);

    // Process each chunk to generate flashcards
    const allFlashcards = [];

    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];

      console.log(`Processing chunk ${i + 1}/${textChunks.length}`);

      const prompt = `
Extract key concepts from this study material chunk and create flashcards in JSON format.
Create 7-10 flashcards covering the most important concepts from this section.

Text content:
${chunk}

Return ONLY a JSON array in this format:
[
  {
    "question": "Clear, specific question",
    "answer": "Detailed answer with explanation", 
    "topic": "Topic category",
    "difficulty": "Easy/Medium/Hard"
  }
]
`;

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 1500,
        });

        const aiResponse = completion.choices[0].message.content;
        // Clean response (remove markdown if present)
        const cleanResponse = aiResponse
          .replace(/```json\n?|\n?```/g, "")
          .trim();
        const chunkFlashcards = JSON.parse(cleanResponse);

        // Add to combined array
        allFlashcards.push(...chunkFlashcards);

        console.log(
          `Generated ${chunkFlashcards.length} flashcards from chunk ${i + 1}`
        );
      } catch (parseError) {
        console.error(`Error processing chunk ${i + 1}:`, parseError);
        // Continue with other chunks instead of failing completely
      }
    }

    // Remove duplicates and limit total flashcards
    const uniqueFlashcards = [];
    const seenQuestions = new Set();

    for (const card of allFlashcards) {
      const question = card.question.toLowerCase();
      if (!seenQuestions.has(question)) {
        seenQuestions.add(question);
        uniqueFlashcards.push(card);
      }
    }

    const flashcards = uniqueFlashcards
      .sort(() => Math.random() - 0.5)
      .slice(0, 25); // Limit to 25 total flashcards

    console.log(
      `Generated ${flashcards.length} unique flashcards from ${textChunks.length} chunks`
    );

    // Store flashcards in database
    const flashcardInserts = flashcards.map((card) => ({
      user_id: userId,
      question: card.question,
      answer: card.answer,
      topic: card.topic || "General",
      difficulty: card.difficulty || "Medium",
      source: "ai_generated",
      repetition_count: 0,
      known_factor: 50,
      created_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from("flashcards")
      .insert(flashcardInserts)
      .select();

    if (error) {
      console.error("Database error:", error);
      return res
        .status(500)
        .json({ error: "Failed to save flashcards to database" });
    }

    console.log(`Successfully saved ${data.length} flashcards to database`);

    res.json({
      success: true,
      message: `Generated and saved ${data.length} flashcards from PDF`,
      flashcardsCount: data.length,
      flashcards: data,
    });
  } catch (error) {
    console.error("Upload and process error:", error);
    res.status(500).json({ error: "Failed to process PDF upload" });
  }
};

// Get user's flashcards
export const getUserFlashcards = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`Fetching flashcards for user: ${userId}`);

    // Get all flashcards sorted by repetition (min first), then known_factor (min first)
    const { data: flashcards, error } = await supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", userId)
      .order("repetition_count", { ascending: true })
      .order("known_factor", { ascending: true });

    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({ error: "Failed to fetch flashcards" });
    }

    if (flashcards.length === 0) {
      return res
        .status(404)
        .json({ error: "No flashcards exist for this user" });
    }

    // Take first 10 cards (lowest repetition + known_factor)
    const cardsToSend = flashcards.slice(0, 10);
    const cardIds = cardsToSend.map((card) => card.id);

    console.log(
      `Found ${flashcards.length} flashcards, sending ${cardsToSend.length}`
    );

    // Update repetition_count +1 for the cards being sent in database
    for (const card of cardsToSend) {
      await supabase
        .from("flashcards")
        .update({ repetition_count: card.repetition_count + 1 })
        .eq("id", card.id);
    }

    // Update the cards we're sending to user (so they see updated count)
    const updatedCardsToSend = cardsToSend.map((card) => ({
      ...card,
      repetition_count: card.repetition_count + 1,
    }));

    console.log(`Updated repetition_count for ${cardsToSend.length} cards`);

    res.json({
      success: true,
      flashcards: updatedCardsToSend,
      total: cardsToSend.length,
    });
  } catch (error) {
    console.error("Get flashcards error:", error);
    res.status(500).json({ error: "Failed to fetch flashcards" });
  }
};

// Update flashcard progress (bulk update)
export const updateFlashcardProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    const { flashcards } = req.body;

    if (!flashcards || !Array.isArray(flashcards)) {
      return res.status(400).json({ error: "Flashcards array is required" });
    }

    console.log(
      `Updating progress for ${flashcards.length} flashcards for user: ${userId}`
    );

    // Update each flashcard's known_factor based on known status
    for (const card of flashcards) {
      let newKnownFactor = card.known_factor;

      if (card.known) {
        newKnownFactor += 1;
      } else {
        newKnownFactor -= 1;
      }

      await supabase
        .from("flashcards")
        .update({ known_factor: newKnownFactor })
        .eq("id", card.id)
        .eq("user_id", userId);
    }

    console.log(`Successfully updated ${flashcards.length} flashcards`);

    res.json({
      success: true,
      message: `Updated progress for ${flashcards.length} flashcards`,
      updatedCount: flashcards.length,
    });
  } catch (error) {
    console.error("Update flashcard progress error:", error);
    res.status(500).json({ error: "Failed to update flashcard progress" });
  }
};

export const exportUserFlashcards = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`Exporting flashcards for user: ${userId}`);

    // Get flashcards data
    const { data: flashcards, error } = await supabase
      .from("flashcards")
      .select("question, answer, topic, difficulty")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Database error:", error);
      return res
        .status(500)
        .json({ error: "Failed to export user flashcards" });
    }

    if (!flashcards || flashcards.length === 0) {
      return res
        .status(404)
        .json({ error: "No flashcards found for this user" });
    }

    console.log(`Found ${flashcards.length} flashcards to export`);

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers for file download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="my-flashcards.pdf"'
    );

    // Pipe PDF to response stream
    doc.pipe(res);

    // Add title
    doc
      .fontSize(24)
      .fillColor("black")
      .text("My DSA Flashcards", { align: "center" });
    doc
      .fontSize(12)
      .fillColor("gray")
      .text(`Generated on ${new Date().toDateString()}`, { align: "center" });
    doc
      .fontSize(10)
      .text(`Total Cards: ${flashcards.length}`, { align: "center" });
    doc.moveDown(3);

    // Add each flashcard
    flashcards.forEach((card, index) => {
      // Check if we need a new page
      if (doc.y > 700) {
        doc.addPage();
      }

      // Card number and topic/difficulty header

      doc
        .fontSize(10)
        .fillColor("gray")
        .text(` | ${card.topic} - ${card.difficulty}`, { align: "right" });

      // Question
      doc.fontSize(12).fillColor("black").text("Q: ", { continued: true });
      doc.fontSize(11).fillColor("black").text(card.question);
      doc.moveDown(0.5);

      // Answer
      doc.fontSize(12).fillColor("darkblue").text("A: ", { continued: true });
      doc.fontSize(11).fillColor("darkblue").text(card.answer);

      // Add separator line
      doc.moveDown(1);
      doc
        .strokeColor("lightgray")
        .lineWidth(0.5)
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke();
      doc.moveDown(1.5);
    });

    // Add footer after all content (without forcing new page)
    doc.moveDown(2);
    doc
      .fontSize(8)
      .fillColor("gray")
      .text("Generated by DoDSA - Keep practicing! 🚀", { align: "center" });

    // Finalize PDF and close stream
    doc.end();

    console.log(`PDF generated and streamed successfully for user: ${userId}`);
  } catch (error) {
    console.error("Export PDF error:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
};
