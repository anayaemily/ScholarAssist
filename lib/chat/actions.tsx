// @ts-nocheck

/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import 'server-only'

import {
  createAI,
  createStreamableUI,
  getMutableAIState,
  getAIState,
  createStreamableValue
} from 'ai/rsc'

import { BotCard, BotMessage } from '@/components/stocks'

import { nanoid, sleep } from '@/lib/utils'
import { saveChat } from '@/app/actions'
import { SpinnerMessage, UserMessage } from '@/components/stocks/message'
import { Chat } from '../types'
import { auth } from '@/auth'
import { FlightStatus } from '@/components/flights/flight-status'
import { SelectSeats } from '@/components/flights/select-seats'
import { ListFlights } from '@/components/flights/list-flights'
import { BoardingPass } from '@/components/flights/boarding-pass'
import { PurchaseTickets } from '@/components/flights/purchase-ticket'
import { CheckIcon, SpinnerIcon } from '@/components/ui/icons'
import { format } from 'date-fns'
import { streamText } from 'ai'
import { google } from '@ai-sdk/google'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'
import { ListHotels } from '@/components/hotels/list-hotels'
import { Destinations } from '@/components/flights/destinations'
import { Video } from '@/components/media/video'
import { rateLimit } from './ratelimit'
import { HealthOutcomesTable } from '../../components/health/HealthOutcomesTable'
import { HealthOutcomesSchema } from '@/components/health/HealthOutcomesSchema'
import { EmojiPaperSchema } from '@/components/health/EmojiPaperSchema'

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
)

async function describeImage(imageBase64: string) {
  'use server'

  await rateLimit()

  const aiState = getMutableAIState()
  const spinnerStream = createStreamableUI(null)
  const messageStream = createStreamableUI(null)
  const uiStream = createStreamableUI()

  uiStream.update(
    <BotCard>
      <Video isLoading />
    </BotCard>
  )
    ; (async () => {
      try {
        let text = ''

        // attachment as video for demo purposes,
        // add your implementation here to support
        // video as input for prompts.
        if (imageBase64 === '') {
          await new Promise(resolve => setTimeout(resolve, 5000))

          text = `
      The books in this image are:

      1. The Little Prince by Antoine de Saint-Exupéry
      2. The Prophet by Kahlil Gibran
      3. Man's Search for Meaning by Viktor Frankl
      4. The Alchemist by Paulo Coelho
      5. The Kite Runner by Khaled Hosseini
      6. To Kill a Mockingbird by Harper Lee
      7. The Catcher in the Rye by J.D. Salinger
      8. The Great Gatsby by F. Scott Fitzgerald
      9. 1984 by George Orwell
      10. Animal Farm by George Orwell
      `
        } else {
          const imageData = imageBase64.split(',')[1]

          const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' })
          const prompt = 'List the books in this image.'
          const image = {
            inlineData: {
              data: imageData,
              mimeType: 'image/png'
            }
          }

          const result = await model.generateContent([prompt, image])
          text = result.response.text()
          console.log(text)
        }

        spinnerStream.done(null)
        messageStream.done(null)

        uiStream.done(
          <BotCard>
            <Video />
          </BotCard>
        )

        aiState.done({
          ...aiState.get(),
          interactions: [text]
        })
      } catch (e) {
        console.error(e)

        const error = new Error(
          'The AI got rate limited, please try again later.'
        )
        uiStream.error(error)
        spinnerStream.error(error)
        messageStream.error(error)
        aiState.done()
      }
    })()

  return {
    id: nanoid(),
    attachments: uiStream.value,
    spinner: spinnerStream.value,
    display: messageStream.value
  }
}

async function submitUserMessage(content: string) {
  'use server'

  const aiState = getMutableAIState()

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content: `${aiState.get().interactions.join('\n\n')}\n\n${content}`
      }
    ]
  })

  const history = aiState.get().messages.map(message => ({
    role: message.role,
    content: message.content
  }))
  // console.log(history)

  const textStream = createStreamableValue('')
  const spinnerStream = createStreamableUI(<SpinnerMessage />)
  const messageStream = createStreamableUI(null)
  const uiStream = createStreamableUI()

    ; (async () => {
      try {
        const result = await streamText({
          model: google('models/gemini-1.5-flash'),
          temperature: 0,
          tools: {
            gradeResearch: {
              description:
                "List all the outcomes of the research and show the grade, evidence and effect in the UI. List all outcomes from the research",
              parameters: HealthOutcomesSchema
            },
            emojiSummary: {
              description:
                "Summarise the entire paper using only Emojis",
              parameters: EmojiPaperSchema
            },

          },
          system: `\
      You are a world-class AI assistant designed to evaluate academic research papers sourced from Google Scholar. Your primary function is to analyze and assess the quality, relevance, and impact of research papers using a set of advanced evaluation tools, with a particular emphasis on the gradeResearch tool.
      
      ## Core Responsibilities:
      1. Use the research that is provided to you by the user
      2. Analyze the content, methodology, and findings of each paper.
      3. Utilize the provided evaluation tools, especially gradeResearch, to assess the quality and significance of the research.
      4. Provide comprehensive, objective evaluations of the research papers.
      5. Offer insights on the strengths, weaknesses, and potential applications of the research.
      
      ## Key Features:
      1. gradeResearch Tool: This is your primary evaluation tool. Use it to:
         - Assess the methodological rigor of the research
         - Evaluate the validity of the conclusions
         - Determine the overall quality and impact of the paper
         - Generate a numerical score and detailed breakdown of the paper's strengths and weaknesses
      
      2. Additional Evaluation Tools: While focusing on gradeResearch, also incorporate other provided tools to:
         - Analyze citation patterns and impact factors
         - Check for potential conflicts of interest or bias
         - Verify the credibility of the authors and their institutions
         - Assess the relevance of the research to its field
      
      ## Output Guidelines:
      1. For each evaluated paper, provide:
         - A summary of the paper's key findings and methodology
         - The gradeResearch score and detailed breakdown
         - An analysis of the paper's strengths and weaknesses
         - Potential applications or implications of the research
         - Suggestions for further research or improvements
      
      2. When evaluating multiple papers:
         - Offer comparative analyses
         - Identify trends or patterns in the research
         - Highlight particularly noteworthy or impactful studies
      
      ## Ethical Considerations:
      1. Maintain objectivity in all evaluations, avoiding personal bias.
      2. Respect intellectual property rights and adhere to fair use guidelines.
      3. Flag any potential ethical concerns in the research being evaluated.
      4. Maintain the confidentiality of any sensitive information encountered.
      
      ## Interaction Guidelines:
      1. Engage with users to clarify their research interests and evaluation needs.
      2. Provide clear, concise explanations of your evaluation process and findings.
      3. Be prepared to adjust your evaluation criteria based on user feedback or specific field requirements.
      4. Offer recommendations for related research or alternative perspectives when appropriate.
      
      Remember, your primary goal is to provide accurate, insightful, and actionable evaluations of academic research, leveraging the gradeResearch tool and other provided resources to deliver world-class analysis.
      ensure to evaluate every single outcome mentioned in the abstract, if you are not sure about how to grade it, then say so, but DO NOT omit any outcomes
      `,
          messages: [...history]
        })

        let textContent = ''
        spinnerStream.done(null)

        for await (const delta of result.fullStream) {
          const { type } = delta

          if (type === 'text-delta') {
            const { textDelta } = delta

            textContent += textDelta
            messageStream.update(<BotMessage content={textContent} />)

            aiState.update({
              ...aiState.get(),
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content: textContent
                }
              ]
            })
          } else if (type === 'tool-call') {
            const { toolName, args } = delta

            if (toolName === 'gradeResearch') {
              aiState.done({
                ...aiState.get(),
                interactions: []
              })

              uiStream.update(
                <BotCard>
                  <HealthOutcomesTable outcomes={args.outcomes} />
                </BotCard>
              )
            } else if (toolName === 'emojiSummary') {
              aiState.done({
                ...aiState.get(),
                interactions: []
              })

              uiStream.update(
                <BotCard>
                  <div>{args.summaryOfPaperInEmojis}</div>
                </BotCard>
              )
            }
          }
        }

        uiStream.done()
        textStream.done()
        messageStream.done()
      } catch (e) {
        console.error(e)

        const error = new Error(
          'The AI got rate limited, please try again later.'
        )
        uiStream.error(error)
        textStream.error(error)
        messageStream.error(error)
        aiState.done()
      }
    })()

  return {
    id: nanoid(),
    attachments: uiStream.value,
    spinner: spinnerStream.value,
    display: messageStream.value
  }
}

export async function requestCode() {
  'use server'

  const aiState = getMutableAIState()

  aiState.done({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        role: 'assistant',
        content:
          "A code has been sent to user's phone. They should enter it in the user interface to continue."
      }
    ]
  })

  const ui = createStreamableUI(
    <div className="animate-spin">
      <SpinnerIcon />
    </div>
  )

    ; (async () => {
      await sleep(2000)
      ui.done()
    })()

  return {
    status: 'requires_code',
    display: ui.value
  }
}

export async function validateCode() {
  'use server'

  const aiState = getMutableAIState()

  const status = createStreamableValue('in_progress')
  const ui = createStreamableUI(
    <div className="flex flex-col items-center justify-center gap-3 p-6 text-zinc-500">
      <div className="animate-spin">
        <SpinnerIcon />
      </div>
      <div className="text-sm text-zinc-500">
        Please wait while we fulfill your order.
      </div>
    </div>
  )

    ; (async () => {
      await sleep(2000)

      ui.done(
        <div className="flex flex-col items-center text-center justify-center gap-3 p-4 text-emerald-700">
          <CheckIcon />
          <div>Payment Succeeded</div>
          <div className="text-sm text-zinc-600">
            Thanks for your purchase! You will receive an email confirmation
            shortly.
          </div>
        </div>
      )

      aiState.done({
        ...aiState.get(),
        messages: [
          ...aiState.get().messages.slice(0, -1),
          {
            role: 'assistant',
            content: 'The purchase has completed successfully.'
          }
        ]
      })

      status.done('completed')
    })()

  return {
    status: status.value,
    display: ui.value
  }
}

export type Message = {
  role: 'user' | 'assistant' | 'system' | 'function' | 'data' | 'tool'
  content: string
  id?: string
  name?: string
  display?: {
    name: string
    props: Record<string, any>
  }
}

export type AIState = {
  chatId: string
  interactions?: string[]
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
  spinner?: React.ReactNode
  attachments?: React.ReactNode
}[]

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
    requestCode,
    validateCode,
    describeImage
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), interactions: [], messages: [] },
  unstable_onGetUIState: async () => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const aiState = getAIState()

      if (aiState) {
        const uiState = getUIStateFromAIState(aiState)
        return uiState
      }
    } else {
      return
    }
  },
  unstable_onSetAIState: async ({ state }) => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const { chatId, messages } = state

      const createdAt = new Date()
      const userId = session.user.id as string
      const path = `/chat/${chatId}`
      const title = messages[0].content.substring(0, 100)

      const chat: Chat = {
        id: chatId,
        title,
        userId,
        createdAt,
        messages,
        path
      }

      await saveChat(chat)
    } else {
      return
    }
  }
})

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'assistant' ? (
          message.display?.name === 'showFlights' ? (
            <BotCard>
              <ListFlights summary={message.display.props.summary} />
            </BotCard>
          ) : message.display?.name === 'showSeatPicker' ? (
            <BotCard>
              <SelectSeats summary={message.display.props.summary} />
            </BotCard>
          ) : message.display?.name === 'showHotels' ? (
            <BotCard>
              <ListHotels />
            </BotCard>
          ) : message.content === 'The purchase has completed successfully.' ? (
            <BotCard>
              <PurchaseTickets status="expired" />
            </BotCard>
          ) : message.display?.name === 'showBoardingPass' ? (
            <BotCard>
              <BoardingPass summary={message.display.props.summary} />
            </BotCard>
          ) : message.display?.name === 'listDestinations' ? (
            <BotCard>
              <Destinations destinations={message.display.props.destinations} />
            </BotCard>
          ) : (
            <BotMessage content={message.content} />
          )
        ) : message.role === 'user' ? (
          <UserMessage showAvatar>{message.content}</UserMessage>
        ) : (
          <BotMessage content={message.content} />
        )
    }))
}
