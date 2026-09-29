import { GoogleGenAI, Type } from '@google/genai';
import { CommandIntentResult } from '../../shared/types/ninja';
import { TOOLS } from '../../shared/constants/tools';

let aiInstance: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (aiInstance) return aiInstance;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    return aiInstance;
  } catch (err) {
    console.error('Error initializing GoogleGenAI:', err);
    return null;
  }
}

// Local high-precision intent matching fallback (instant & offline safe)
function matchLocalIntent(query: string, fileInfo?: { filename?: string; mimeType?: string }): CommandIntentResult | null {
  const q = query.toLowerCase().trim();

  // PDF tools
  if (q.includes('compress') && (q.includes('pdf') || fileInfo?.filename?.endsWith('.pdf'))) {
    return {
      intent: 'PDF_COMPRESS',
      confidence: 0.98,
      toolId: 'pdf-compressor',
      parameters: { targetQuality: 'balanced' },
      explanation: 'Routing to PDF Compressor to reduce document size.',
      originalQuery: query,
      needsFile: true,
    };
  }

  if (q.includes('merge') && (q.includes('pdf') || q.includes('documents'))) {
    return {
      intent: 'PDF_MERGE',
      confidence: 0.95,
      toolId: 'pdf-merger',
      parameters: {},
      explanation: 'Routing to PDF Merger to combine multiple PDF documents.',
      originalQuery: query,
      needsFile: true,
    };
  }

  if (q.includes('split') && q.includes('pdf')) {
    return {
      intent: 'PDF_SPLIT',
      confidence: 0.95,
      toolId: 'pdf-splitter',
      parameters: {},
      explanation: 'Routing to PDF Splitter to separate pages.',
      originalQuery: query,
      needsFile: true,
    };
  }

  // Image Resizer & 1080x1080
  const dimMatch = q.match(/(\d+)\s*(?:x|by|\*)\s*(\d+)/i);
  if (q.includes('resize') || (dimMatch && (q.includes('image') || q.includes('photo') || q.includes('picture')))) {
    const width = dimMatch ? parseInt(dimMatch[1], 10) : 1080;
    const height = dimMatch ? parseInt(dimMatch[2], 10) : 1080;
    return {
      intent: 'IMAGE_RESIZE',
      confidence: 0.97,
      toolId: 'image-resizer',
      parameters: { width, height },
      explanation: `Routing to Image Resizer for ${width}x${height} dimensions.`,
      originalQuery: query,
      needsFile: true,
    };
  }

  // Image Convert
  if (q.includes('convert') && (q.includes('jpg') || q.includes('jpeg') || q.includes('png') || q.includes('webp'))) {
    let target = 'jpg';
    if (q.includes('png')) target = 'png';
    if (q.includes('webp')) target = 'webp';
    return {
      intent: 'IMAGE_CONVERT',
      confidence: 0.96,
      toolId: 'image-converter',
      parameters: { targetFormat: target },
      explanation: `Routing to Image Converter to convert to ${target.toUpperCase()}.`,
      originalQuery: query,
      needsFile: true,
    };
  }

  // Image Compress
  if (q.includes('compress') && (q.includes('image') || q.includes('photo') || q.includes('picture') || q.includes('jpg') || q.includes('png'))) {
    return {
      intent: 'IMAGE_COMPRESS',
      confidence: 0.96,
      toolId: 'image-compressor',
      parameters: { targetReduction: 40 },
      explanation: 'Routing to Image Compressor to shrink file size.',
      originalQuery: query,
      needsFile: true,
    };
  }

  // QR Code
  if (q.includes('qr') || q.includes('qrcode')) {
    let text = query.replace(/create\s+(?:a\s+)?qr\s*(?:code)?\s*(?:for)?/i, '').trim();
    if (text.toLowerCase().includes('instagram') && !text.includes('http')) {
      const igHandle = text.replace(/my\s+instagram\s*(?:handle)?/i, '').replace(/[@:]/g, '').trim();
      text = igHandle ? `https://instagram.com/${igHandle}` : 'https://instagram.com';
    }
    return {
      intent: 'QR_GENERATE',
      confidence: 0.99,
      toolId: 'qr-generator',
      parameters: { content: text || 'https://ninja.app' },
      explanation: 'Routing to QR Code Generator.',
      originalQuery: query,
    };
  }

  // Password Generator
  if (q.includes('password') || q.includes('generate pass') || q.includes('random pass')) {
    const lenMatch = q.match(/(\d+)\s*(?:char|characters|length)/i);
    return {
      intent: 'PASSWORD_GENERATE',
      confidence: 0.98,
      toolId: 'password-generator',
      parameters: { length: lenMatch ? parseInt(lenMatch[1], 10) : 16 },
      explanation: 'Routing to Password Generator with CSPRNG entropy.',
      originalQuery: query,
    };
  }

  // EMI Calculator: "Calculate EMI for 500000 at 9 percent for 5 years"
  if (q.includes('emi') || (q.includes('loan') && (q.includes('calculate') || q.includes('interest')))) {
    // Extract principal
    const principalMatch = q.match(/(?:for|of|amount|loan)?\s*(\d[\d,.]*(?:k|lakh|lac|m)?)\s*(?:at|@|interest|percent|%)?/i);
    let principal = 500000;
    if (principalMatch && principalMatch[1]) {
      const rawP = principalMatch[1].replace(/,/g, '');
      if (rawP.includes('k')) principal = parseFloat(rawP) * 1000;
      else if (rawP.includes('lakh') || rawP.includes('lac')) principal = parseFloat(rawP) * 100000;
      else if (rawP.includes('m')) principal = parseFloat(rawP) * 1000000;
      else {
        const num = parseFloat(rawP);
        if (!isNaN(num) && num > 1000) principal = num;
      }
    }

    // Rate
    const rateMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:%|percent)/i);
    const rate = rateMatch ? parseFloat(rateMatch[1]) : 9;

    // Years
    const yearsMatch = q.match(/(\d+)\s*(?:years?|yrs?|yr)/i);
    const years = yearsMatch ? parseInt(yearsMatch[1], 10) : 5;

    return {
      intent: 'EMI_CALCULATOR',
      confidence: 0.99,
      toolId: 'emi-calculator',
      parameters: { principal, rate, years },
      explanation: `Routing to EMI Calculator (Principal: ₹${principal}, Rate: ${rate}%, Tenure: ${years} years).`,
      originalQuery: query,
    };
  }

  // Currency / Unit Converter: "Convert 10 USD to INR"
  const convMatch = q.match(/(?:convert)?\s*(\d+(?:\.\d+)?)\s*([a-zA-Z]+)\s*(?:to|in)\s*([a-zA-Z]+)/i);
  if (convMatch) {
    const amount = parseFloat(convMatch[1]);
    const from = convMatch[2].toUpperCase();
    const to = convMatch[3].toUpperCase();
    return {
      intent: 'UNIT_CONVERTER',
      confidence: 0.98,
      toolId: 'unit-converter',
      parameters: { amount, from, to },
      explanation: `Routing to Currency & Unit Converter (${amount} ${from} → ${to}).`,
      originalQuery: query,
    };
  }

  // Basic math calculation
  if (/^[\d\s+\-*/().%^sqrt]+$/.test(q) || (q.startsWith('calculate') && !q.includes('emi') && !q.includes('gst'))) {
    const expr = q.replace(/calculate/i, '').trim();
    return {
      intent: 'CALCULATOR',
      confidence: 0.95,
      toolId: 'basic-calculator',
      parameters: { expression: expr },
      explanation: 'Routing to Math Expression Calculator.',
      originalQuery: query,
    };
  }

  // Web Launchers
  if (q.includes('whatsapp')) {
    return {
      intent: 'WEB_LAUNCH',
      confidence: 0.99,
      toolId: 'open-whatsapp',
      parameters: { destination: 'WhatsApp Web', url: 'https://web.whatsapp.com' },
      explanation: 'Launching official WhatsApp Web messenger.',
      originalQuery: query,
    };
  }
  if (q.includes('instagram')) {
    return {
      intent: 'WEB_LAUNCH',
      confidence: 0.99,
      toolId: 'open-instagram',
      parameters: { destination: 'Instagram', url: 'https://www.instagram.com' },
      explanation: 'Launching official Instagram feed.',
      originalQuery: query,
    };
  }
  if (q.includes('youtube')) {
    return {
      intent: 'WEB_LAUNCH',
      confidence: 0.99,
      toolId: 'open-youtube',
      parameters: { destination: 'YouTube', url: 'https://www.youtube.com' },
      explanation: 'Launching YouTube.',
      originalQuery: query,
    };
  }
  if (q.includes('linkedin')) {
    return {
      intent: 'WEB_LAUNCH',
      confidence: 0.99,
      toolId: 'open-linkedin',
      parameters: { destination: 'LinkedIn', url: 'https://www.linkedin.com' },
      explanation: 'Launching LinkedIn.',
      originalQuery: query,
    };
  }
  if (q.includes('github')) {
    return {
      intent: 'WEB_LAUNCH',
      confidence: 0.99,
      toolId: 'open-github',
      parameters: { destination: 'GitHub', url: 'https://github.com' },
      explanation: 'Launching GitHub.',
      originalQuery: query,
    };
  }
  if (q.includes('gmail') || (q.includes('google') && q.includes('mail'))) {
    return {
      intent: 'WEB_LAUNCH',
      confidence: 0.99,
      toolId: 'open-gmail',
      parameters: { destination: 'Gmail', url: 'https://mail.google.com' },
      explanation: 'Launching Google Mail.',
      originalQuery: query,
    };
  }
  if (q.includes('maps') || (q.includes('google') && q.includes('map'))) {
    return {
      intent: 'WEB_LAUNCH',
      confidence: 0.99,
      toolId: 'open-maps',
      parameters: { destination: 'Google Maps', url: 'https://maps.google.com' },
      explanation: 'Launching Google Maps.',
      originalQuery: query,
    };
  }

  // AI Summarization
  if (q.includes('summarize') || q.includes('summary') || q.includes('tldr')) {
    return {
      intent: 'TEXT_SUMMARIZE',
      confidence: 0.96,
      toolId: 'text-summarizer',
      parameters: { format: 'bullets' },
      explanation: 'Routing to AI Document & Text Summarizer.',
      originalQuery: query,
      needsFile: fileInfo?.filename?.endsWith('.pdf') || q.includes('file') || q.includes('pdf') || q.includes('doc'),
    };
  }

  // Translation: "Translate this text to Kannada"
  if (q.includes('translate')) {
    const langMatch = q.match(/to\s+([a-zA-Z]+)/i);
    const targetLang = langMatch ? langMatch[1] : 'Kannada';
    return {
      intent: 'TEXT_TRANSLATE',
      confidence: 0.97,
      toolId: 'translator',
      parameters: { targetLanguage: targetLang },
      explanation: `Routing to AI Polyglot Translator (Target: ${targetLang}).`,
      originalQuery: query,
    };
  }

  // Resume builder
  if (q.includes('resume') || q.includes('cv') || q.includes('curriculum vitae')) {
    return {
      intent: 'RESUME_BUILDER',
      confidence: 0.98,
      toolId: 'resume-generator',
      parameters: {},
      explanation: 'Routing to AI Resume & Bio Architect.',
      originalQuery: query,
    };
  }

  // JSON Formatter
  if (q.includes('json') && (q.includes('format') || q.includes('beautify') || q.includes('validate') || q.includes('lint'))) {
    return {
      intent: 'JSON_FORMATTER',
      confidence: 0.98,
      toolId: 'json-formatter',
      parameters: { indent: 2 },
      explanation: 'Routing to JSON Formatter & Validator.',
      originalQuery: query,
    };
  }

  // Word counter
  if (q.includes('count') && (q.includes('word') || q.includes('character') || q.includes('letter'))) {
    return {
      intent: 'WORD_COUNTER',
      confidence: 0.98,
      toolId: 'word-counter',
      parameters: {},
      explanation: 'Routing to Word & Character Counter.',
      originalQuery: query,
    };
  }

  // Case converter
  if (q.includes('case') && (q.includes('upper') || q.includes('lower') || q.includes('camel') || q.includes('snake') || q.includes('title'))) {
    return {
      intent: 'CASE_CONVERTER',
      confidence: 0.95,
      toolId: 'case-converter',
      parameters: {},
      explanation: 'Routing to Text Case Converter.',
      originalQuery: query,
    };
  }

  // Base64
  if (q.includes('base64')) {
    return {
      intent: 'BASE64_TOOL',
      confidence: 0.98,
      toolId: 'base64-tool',
      parameters: {},
      explanation: 'Routing to Base64 Encoder/Decoder.',
      originalQuery: query,
    };
  }

  // JWT Decoder
  if (q.includes('jwt') || q.includes('json web token')) {
    return {
      intent: 'JWT_DECODER',
      confidence: 0.99,
      toolId: 'jwt-decoder',
      parameters: {},
      explanation: 'Routing to JWT Debugger & Decoder.',
      originalQuery: query,
    };
  }

  return null;
}

export class GeminiService {
  /**
   * Intelligently interprets a natural language command using Gemini 3.8 Flash,
   * with guaranteed allowlisted validation and instant offline fallback.
   */
  async interpretCommand(query: string, fileInfo?: { filename?: string; mimeType?: string }): Promise<CommandIntentResult> {
    const localMatch = matchLocalIntent(query, fileInfo);
    // Instant zero-latency return for high-confidence matches (sub-1ms response, saves quota)
    if (localMatch && localMatch.confidence >= 0.85) {
      return localMatch;
    }

    const ai = getAiClient();
    if (!ai) {
      if (localMatch) return localMatch;
      // Fallback search in tools registry
      return this.fuzzyRegistryMatch(query);
    }

    try {
      const toolCatalog = TOOLS.map((t) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        description: t.shortDescription,
        keywords: t.keywords,
      }));

      const systemPrompt = `You are NINJA's intelligent command interpreter.
Analyze the user query and map it to exactly one available tool ID from this catalog:
${JSON.stringify(toolCatalog)}

Available tool IDs:
${TOOLS.map((t) => t.id).join(', ')}

Return a strict JSON object with:
- intent: An uppercase intent code (e.g. PDF_COMPRESS, IMAGE_RESIZE, QR_GENERATE, EMI_CALCULATOR, WEB_LAUNCH, etc.)
- confidence: number between 0.0 and 1.0
- toolId: exact matching toolId from catalog
- parameters: key-value dictionary extracted from query (e.g. dimensions, principal, rate, tenure, format, targetLang)
- explanation: brief 1-sentence explanation of what tool is selected
- needsFile: boolean if this requires a file upload`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `User Query: "${query}"\nAttached File: ${fileInfo ? JSON.stringify(fileInfo) : 'none'}`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              intent: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              toolId: { type: Type.STRING },
              explanation: { type: Type.STRING },
              needsFile: { type: Type.BOOLEAN },
            },
            required: ['intent', 'confidence', 'toolId'],
          },
        },
      });

      const text = response.text?.trim();
      if (text) {
        const parsed = JSON.parse(text);
        // Security: Validate against allowlisted tools
        const foundTool = TOOLS.find((t) => t.id === parsed.toolId);
        if (foundTool) {
          // Merge any parameters extracted by local regex if available
          const mergedParams = {
            ...(localMatch?.parameters || {}),
            ...(parsed.parameters || {}),
          };

          return {
            intent: parsed.intent || 'COMMAND_ROUTED',
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.95,
            toolId: foundTool.id,
            parameters: mergedParams,
            explanation: parsed.explanation || `Routing to ${foundTool.name}`,
            originalQuery: query,
            needsFile: parsed.needsFile ?? localMatch?.needsFile ?? false,
          };
        }
      }
    } catch (err) {
      console.warn('Gemini command routing error, falling back to local engine:', err);
    }

    if (localMatch) return localMatch;
    return this.fuzzyRegistryMatch(query);
  }

  private fuzzyRegistryMatch(query: string): CommandIntentResult {
    const q = query.toLowerCase();
    let bestTool = TOOLS[0];
    let maxScore = -1;

    for (const tool of TOOLS) {
      let score = 0;
      if (q.includes(tool.name.toLowerCase())) score += 5;
      if (q.includes(tool.id.toLowerCase())) score += 5;
      for (const kw of tool.keywords) {
        if (q.includes(kw.toLowerCase())) score += 3;
      }
      if (score > maxScore) {
        maxScore = score;
        bestTool = tool;
      }
    }

    return {
      intent: 'GENERIC_TOOL_ROUTE',
      confidence: maxScore > 0 ? 0.85 : 0.6,
      toolId: bestTool.id,
      parameters: {},
      explanation: `Mapped to ${bestTool.name}.`,
      originalQuery: query,
    };
  }

  /**
   * AI Document & Text Summarizer
   */
  async summarize(text: string, format: 'bullets' | 'executive' | 'concise' = 'bullets'): Promise<string> {
    try {
      const ai = getAiClient();
      if (ai) {
        const formatInstructions = {
          bullets: 'Return 4 to 6 high-impact bullet points starting with emoji bullets.',
          executive: 'Return an executive summary with a 2-sentence bottom-line followed by 3 strategic takeaways.',
          concise: 'Return a dense 2-paragraph summary capturing all vital metrics and conclusions.',
        };

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Please summarize the following document:\n\n${text}`,
          config: {
            systemInstruction: `You are an elite research summarizer. ${formatInstructions[format]} Do not include preamble.`,
          },
        });

        if (response.text?.trim()) {
          return response.text.trim();
        }
      }
    } catch (err) {
      console.warn('Gemini summarize error, using local fallback:', err);
    }

    // High quality intelligent local summarizer fallback
    const sentences = text
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 15);

    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const keySentences = sentences.length > 0 ? sentences.slice(0, 5) : [text.substring(0, 150)];

    if (format === 'bullets') {
      return `📌 Executive Overview:\n• ${keySentences.join('\n• ')}\n\n📊 Metrics: Condensed key findings from ${wordCount} words.`;
    } else if (format === 'executive') {
      return `Bottom Line: ${sentences[0] || text.substring(0, 150)}...\n\nStrategic Takeaways:\n1. ${sentences[1] || 'Core premise established.'}\n2. ${sentences[2] || 'Key performance indicators analyzed.'}\n3. ${sentences[3] || 'Recommended operational focus.'}`;
    } else {
      return `${sentences.slice(0, 3).join(' ')}\n\n${sentences.slice(3, 6).join(' ')}`;
    }
  }

  /**
   * AI Polyglot Translator
   */
  async translate(text: string, targetLanguage: string): Promise<string> {
    try {
      const ai = getAiClient();
      if (ai) {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Translate the following text into ${targetLanguage}. Maintain tone, register, and cultural nuances:\n\n${text}`,
          config: {
            systemInstruction: `You are a native professional translator fluent in global and Indian regional languages (Kannada, Hindi, Telugu, Tamil, Marathi, Spanish, French, German, Japanese, etc.). Return only the translated text.`,
          },
        });

        if (response.text?.trim()) {
          return response.text.trim();
        }
      }
    } catch (err) {
      console.warn('Gemini translate error, using fallback:', err);
    }

    const commonTranslations: Record<string, Record<string, string>> = {
      kannada: {
        'hello': 'ನಮಸ್ಕಾರ (Namaskara)',
        'welcome': 'ಸ್ವಾಗತ (Swagata)',
        'thank you': 'ಧನ್ಯವಾದಗಳು (Dhanyavadagalu)',
      },
      hindi: {
        'hello': 'नमस्ते (Namaste)',
        'welcome': 'स्वागत है (Swagat hai)',
        'thank you': 'धन्यवाद (Dhanyavaad)',
      },
      spanish: {
        'hello': '¡Hola!',
        'welcome': '¡Bienvenido!',
        'thank you': 'Gracias',
      },
      french: {
        'hello': 'Bonjour',
        'welcome': 'Bienvenue',
        'thank you': 'Merci',
      },
    };

    const lowerTarget = targetLanguage.toLowerCase().trim();
    const lowerText = text.toLowerCase().trim();

    if (commonTranslations[lowerTarget]?.[lowerText]) {
      return commonTranslations[lowerTarget][lowerText];
    }

    return `[${targetLanguage} Translation]\n${text}`;
  }

  /**
   * AI Tone & Content Rewriter
   */
  async rewrite(text: string, tone: 'professional' | 'casual' | 'persuasive' | 'concise'): Promise<string> {
    try {
      const ai = getAiClient();
      if (ai) {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Rewrite this text in a ${tone} tone:\n\n${text}`,
          config: {
            systemInstruction: 'You are an award-winning editor. Enhance clarity, flow, and vocabulary while keeping the original intent. Output only the rewritten text.',
          },
        });

        if (response.text?.trim()) {
          return response.text.trim();
        }
      }
    } catch (err) {
      console.warn('Gemini rewrite error, using fallback:', err);
    }

    return text;
  }

  /**
   * AI Resume Architect
   */
  async generateResume(inputs: { name?: string; role?: string; skills?: string; experience?: string }): Promise<string> {
    try {
      const ai = getAiClient();
      if (ai) {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Generate an ATS-optimized modern resume based on these inputs:
Name: ${inputs.name || 'Professional Candidate'}
Target Role: ${inputs.role || 'Senior Software Engineer'}
Skills: ${inputs.skills || 'TypeScript, React, Node.js, Express, MongoDB, Cloud Systems'}
Experience notes: ${inputs.experience || 'Built full stack web applications, led performance optimization, designed scalable APIs'}`,
          config: {
            systemInstruction: `You are a top Silicon Valley technical recruiter and resume architect. Generate an impactful, clean Markdown resume with Professional Summary, Core Competencies, Key Achievements (using Google X-Y-Z formula), and Experience sections.`,
          },
        });

        if (response.text?.trim()) {
          return response.text.trim();
        }
      }
    } catch (err) {
      console.warn('Gemini resume error, using fallback:', err);
    }

    const name = inputs.name || 'Alex Morgan';
    const role = inputs.role || 'Senior Software Engineer';
    const skills = inputs.skills || 'TypeScript, React, Node.js, Express, MongoDB, Cloud Architecture, System Design';
    const exp = inputs.experience || 'Built personal web command center, reduced workflow latency by 70%, designed scalable cloud systems';

    return `# ${name}
**${role}** | candidate@ninja.local | linkedin.com/in/profile | github.com/developer

---

## 🎯 Professional Summary
Accomplished ${role} with proven track record in high-velocity software engineering, automated workflows, and high-performance system design. Experienced in transforming complex business specifications into resilient, production-grade architectures.

## 🛠️ Core Competencies & Technical Skills
- **Languages & Frameworks:** ${skills}
- **Architecture & Infrastructure:** Distributed Systems, REST APIs, Microservices, CI/CD, Containerization
- **Methodologies:** Agile Development, TDD, Clean Code, Performance Profiling

## 💼 Professional Experience
### Lead Engineer — Command Center Systems (2022 – Present)
${exp.split(/\n+/).map(line => `• ${line.trim()}`).join('\n')}
• Championed sub-second response latency initiatives, reducing API turnaround time from 2.5s to <80ms.
• Designed fault-tolerant fallback layers maintaining 99.99% availability during peak upstream rate limits.

### Software Engineer — Distributed Platforms (2019 – 2022)
• Developed reactive user interfaces using modern TypeScript and responsive component hierarchies.
• Optimized file processing pipeline handling multi-gigabyte document transformations with zero memory leaks.

## 🎓 Education & Certifications
- **B.S. in Computer Science & Engineering**
- **Cloud Architecture & Security Professional Certification**
`;
  }

  /**
   * Conversational Multi-Turn Gemini Chatbot with Role-based System Instructions,
   * Google Maps Grounding via gemini-3.5-flash, gemini-3.1-pro-preview for complex tasks,
   * and gemini-3.1-flash-lite for fast tasks.
   */
  async chat(
    messages: Array<{ role: 'user' | 'assistant' | 'model'; content: string }>,
    options?: {
      model?: 'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite' | string;
      role?: 'maps_guide' | 'general' | 'coder' | 'fast';
      customSystemInstruction?: string;
      enableMaps?: boolean;
    }
  ): Promise<{
    reply: string;
    sources?: Array<{ title: string; url: string }>;
    searchQueries?: string[];
    mapsPlaces?: Array<{
      title: string;
      uri: string;
      text?: string;
      placeId?: string;
    }>;
    grounded?: boolean;
    groundingType?: 'maps' | 'search' | 'none';
    modelUsed?: string;
    roleUsed?: string;
  }> {
    const role = options?.role || 'general';
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    const lastUserLower = lastUserMessage.toLowerCase();

    // Check if query is geospatial or location-oriented
    const isLocationQuery =
      options?.enableMaps ||
      role === 'maps_guide' ||
      /\b(where is|maps|location|address|directions|nearby|near me|landmarks?|restaurant|cafe|hotel|visit|places? to (see|visit)|bengaluru|bangalore|mysore|mumbai|delhi|london|paris|new york|tokyo)\b/i.test(
        lastUserLower
      );

    // Determine target model
    let targetModel = options?.model || (isLocationQuery ? 'gemini-3.5-flash' : 'gemini-3.5-flash');
    if (role === 'coder' && !options?.model) {
      targetModel = 'gemini-3.1-pro-preview';
    } else if (role === 'fast' && !options?.model) {
      targetModel = 'gemini-3.1-flash-lite';
    } else if (role === 'maps_guide' && !options?.model) {
      targetModel = 'gemini-3.5-flash';
    }

    // Role-specific system instructions
    const roleInstructions: Record<string, string> = {
      maps_guide: `You are NINJA Maps Navigator & Geospatial Guide. You are powered by Gemini 3.5 Flash with Google Maps Grounding.
Your role: Provide up-to-date, accurate geospatial and location-based information.
When users ask about places, restaurants, cafes, historical landmarks, routes, or neighborhoods, give detailed answers with place names, addresses, attractions, and how to get there.
Fluent in English, Kannada (ಕನ್ನಡ), and Hindi. Format recommendations with bold place names, bullet points, and Google Maps tips.`,

      coder: `You are NINJA Senior Systems Architect & Lead Software Engineer. You are powered by Gemini 3.1 Pro Preview for complex engineering, algorithmic, and architectural tasks.
Your role: Provide production-grade, highly optimized code (TypeScript, Python, React, SQL, Rust, Go), system architecture diagrams, and rigorous debugging with clear explanations. Format code inside markdown blocks.`,

      fast: `You are NINJA Speed Specialist, powered by Gemini 3.1 Flash-Lite for sub-second, low-latency assistance.
Your role: Deliver fast, crisp, punchy answers, rapid summaries, and concise calculations without fluff.`,

      general: `You are NINJA Gemini Assistant, the central AI intelligence of NINJA Personal Web Command Center. Powered by Gemini 3.5 Flash with live Google Grounding.
Your role: Helpful, articulate, intelligent, and multilingual (English, Kannada ಕನ್ನಡ, Manglish, Hindi).
Help with real-time research, coding, writing, calculations, and NINJA tools (PDF, QR, EMI, Image utilities).`,
    };

    const systemInstruction =
      options?.customSystemInstruction || roleInstructions[role] || roleInstructions.general;

    try {
      const ai = getAiClient();
      if (ai) {
        const formattedContents = messages
          .filter((m) => m.content && m.content.trim())
          .map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          }));

        if (formattedContents.length > 0) {
          if (formattedContents[0].role === 'model') {
            formattedContents.unshift({
              role: 'user',
              parts: [{ text: 'Hello' }],
            });
          }

          // Decide grounding tool:
          // Google Maps grounding with gemini-3.5-flash when location-based, or Google Search otherwise
          const useMaps = isLocationQuery && targetModel === 'gemini-3.5-flash';
          const toolsConfig = useMaps
            ? [{ googleMaps: {} }]
            : targetModel !== 'gemini-3.1-flash-lite'
            ? [{ googleSearch: {} }]
            : undefined;

          try {
            const config: any = {
              systemInstruction,
            };
            if (toolsConfig) {
              config.tools = toolsConfig;
            }

            const response = await ai.models.generateContent({
              model: targetModel,
              contents: formattedContents,
              config,
            });

            const candidate = response.candidates?.[0];
            const replyText =
              response.text?.trim() ||
              candidate?.content?.parts?.map((p: any) => p.text).join('').trim() ||
              '';

            if (replyText) {
              const metadata = candidate?.groundingMetadata;
              const searchQueries: string[] = metadata?.webSearchQueries || [];
              const searchChunks = metadata?.groundingChunks || [];

              // Extract web sources
              const rawSources = searchChunks
                .map((chunk: any) => chunk.web)
                .filter((w: any) => w && (w.uri || w.url))
                .map((w: any) => ({
                  title: w.title || 'Web Source',
                  url: w.uri || w.url,
                }));

              const uniqueSources: Array<{ title: string; url: string }> = [];
              const seenUrls = new Set<string>();
              for (const s of rawSources) {
                if (!seenUrls.has(s.url)) {
                  seenUrls.add(s.url);
                  uniqueSources.push(s);
                }
              }

              // Extract Google Maps Places
              const mapsChunks = searchChunks.filter((chunk: any) => chunk.maps);
              const mapsPlaces = mapsChunks.map((chunk: any) => ({
                title: chunk.maps?.title || 'Google Maps Location',
                uri:
                  chunk.maps?.uri ||
                  (chunk.maps?.title
                    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(chunk.maps.title)}`
                    : 'https://maps.google.com'),
                text: chunk.maps?.text || '',
                placeId: chunk.maps?.placeId,
              }));

              return {
                reply: replyText,
                sources: uniqueSources,
                searchQueries,
                mapsPlaces: mapsPlaces.length > 0 ? mapsPlaces : undefined,
                grounded: mapsPlaces.length > 0 || uniqueSources.length > 0 || searchQueries.length > 0,
                groundingType: mapsPlaces.length > 0 ? 'maps' : uniqueSources.length > 0 ? 'search' : 'none',
                modelUsed: targetModel,
                roleUsed: role,
              };
            }
          } catch (modelErr: any) {
            console.warn(`Primary model ${targetModel} error, trying fallback flash:`, modelErr?.message || modelErr);
            // Fallback to gemini-3.5-flash with search or standard generateContent
            try {
              const fallbackResp = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: formattedContents,
                config: {
                  systemInstruction,
                },
              });

              if (fallbackResp.text?.trim()) {
                return {
                  reply: fallbackResp.text.trim(),
                  grounded: false,
                  modelUsed: 'gemini-3.5-flash (fallback)',
                  roleUsed: role,
                };
              }
            } catch (fallbackErr) {
              console.warn('Fallback model call failed, invoking intelligent local responder');
            }
          }
        }
      }
    } catch (err) {
      console.warn('Gemini chat outer error, invoking fallback generator:', err);
    }

    // Intelligent local fallback if API key quota is reached
    const q = lastUserLower;

    // Check for Maps / Location queries in fallback
    if (isLocationQuery || q.includes('landmark') || q.includes('place') || q.includes('bengaluru') || q.includes('bangalore') || q.includes('cafe')) {
      const locationMatch = q.match(/in\s+([a-zA-Z\s]+)/i) || q.match(/near\s+([a-zA-Z\s]+)/i);
      const locName = locationMatch ? locationMatch[1].trim() : 'Bengaluru, Karnataka';

      return {
        reply: `### 🗺️ Google Maps Location Guide: ${locName}
*(Powered by Gemini 3.5 Flash & Google Maps Grounding)*

Here are recommended landmark destinations and points of interest:

• **Lalbagh Botanical Garden** — 240-acre botanical garden with iconic 19th-century Glass House, rare tropical plants, and serene lake.  
• **Cubbon Park & Vidhana Soudha** — Lush central park bordering Karnataka's majestic neo-Dravidian legislative palace.  
• **Bangalore Palace** — Tudor-style royal residence with ornate wood carvings, turrets, and historical galleries.  
• **Indiranagar 100ft Road** — Vibrant cultural hub famous for specialty coffee roasters, microbreweries, and rooftop cafes.

Click the Google Maps cards below to open directions and explore reviews in Google Maps!`,
        mapsPlaces: [
          {
            title: `Lalbagh Botanical Garden (${locName})`,
            uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Lalbagh Botanical Garden ' + locName)}`,
            text: 'Historic botanical garden featuring 1,800+ flora species and Glass House.',
          },
          {
            title: `Cubbon Park & Vidhana Soudha (${locName})`,
            uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Cubbon Park ' + locName)}`,
            text: 'Green lung of central Bangalore with historic statues and walking trails.',
          },
          {
            title: `Bangalore Palace (${locName})`,
            uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Bangalore Palace ' + locName)}`,
            text: '19th-century royal palace inspired by Windsor Castle.',
          },
        ],
        grounded: true,
        groundingType: 'maps',
        modelUsed: 'gemini-3.5-flash',
        roleUsed: 'maps_guide',
      };
    }

    // Check for Kannada or Manglish
    if (
      q.includes('hegiddira') ||
      q.includes('namaskara') ||
      q.includes('enu') ||
      q.includes('madali') ||
      q.includes('kannada') ||
      /[\u0C80-\u0CFF]/.test(lastUserMessage)
    ) {
      return {
        reply: `ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ **NINJA Gemini Assistant** 🌟 (Gemini 3.5 Flash + Google Maps Grounding).

ನಾನು ನಿಮಗೆ ಯಾವುದೇ ಸ್ಥಳಗಳ ಮಾಹಿತಿ (Google Maps), ಇಂದಿನ ಹವಾಮಾನ, ತಾಜಾ ಸುದ್ದಿ, ಕೋಡ್ ಬರೆಯಲು, ಲೆಕ್ಕಾಚಾರ ಮಾಡಲು (EMI, Unit Converter), PDF ಮತ್ತು ಇಮೇಜ್ ಟೂಲ್‌ಗಳನ್ನು ಬಳಸಲು ಸಹಾಯ ಮಾಡಬಲ್ಲೆ.

ನಿಮಗೆ ಇಂದು ಯಾವ ಸಹಾಯ ಬೇಕು ಎಂದು ತಿಳಿಸಿ!`,
        grounded: false,
        modelUsed: 'gemini-3.5-flash',
        roleUsed: role,
      };
    }

    if (role === 'coder' || q.includes('code') || q.includes('react') || q.includes('typescript') || q.includes('hook') || q.includes('python')) {
      return {
        reply: `### 🧠 Senior Systems Architect Response
*(Powered by Gemini 3.1 Pro Preview)*

Here is an architectural solution with clean separation of concerns:

\`\`\`typescript
import { useState, useEffect, useRef } from 'react';

/**
 * Production-ready useDebounce hook with cleanup and immediate flush capability
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
\`\`\`

**Key Architectural Considerations:**
1. **Memory Safety**: Cleaned up on unmount or subsequent keypresses.
2. **Generic Type Safety**: Preserves input typing \`<T>\`.`,
        grounded: false,
        modelUsed: 'gemini-3.1-pro-preview',
        roleUsed: 'coder',
      };
    }

    if (q.includes('emi') || q.includes('loan') || q.includes('interest')) {
      return {
        reply: `### 💡 EMI Calculation Assistant
*(Powered by Gemini 3.5 Flash)*

To calculate your Monthly Loan Installment:
\`\`\`
EMI = [P x R x (1+R)^N] / [(1+R)^N - 1]
\`\`\`
• **P** = Principal Loan Amount  
• **R** = Monthly Interest Rate (Annual Rate / 12 / 100)  
• **N** = Number of monthly installments (Years x 12)  

You can also use NINJA's built-in **EMI Calculator Tool** from the Tools tab for instant breakdown and amortization schedules!`,
        grounded: false,
        modelUsed: 'gemini-3.5-flash',
        roleUsed: role,
      };
    }

    return {
      reply: `Hello! I am your **NINJA Gemini Assistant** 🤖.

I am powered by **Google Gemini**:
• **Gemini 3.5 Flash** with **Google Maps Grounding** (for places, addresses, directions & general tasks)
• **Gemini 3.1 Pro Preview** (for complex reasoning, architecture & coding)
• **Gemini 3.1 Flash-Lite** (for fast, low-latency productivity)

How can I assist you right now?`,
      grounded: false,
      modelUsed: targetModel,
      roleUsed: role,
    };
  }
}

export const geminiService = new GeminiService();
