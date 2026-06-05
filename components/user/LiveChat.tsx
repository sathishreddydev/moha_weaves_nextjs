"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  Maximize2,
  User,
  Bot,
} from "lucide-react";
import { OrderWithItems } from "@/shared";

interface Message {
  id: string;
  text: string;
  sender: "user" | "support";
  timestamp: Date;
  showQuickActions?: boolean;
  showActionButtons?: boolean;
  actionType?: "return" | "exchange" | "track" | "cancel";
}

type ConversationStage = "greeting" | "understanding" | "resolving" | "followup";

interface LiveChatProps {
  orderContext?: {
    orderId: string;
    order: OrderWithItems;
    productName?: string;
  };
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onReturnClick?: (itemId: string, type: "return" | "exchange") => void;
}

const FALLBACK_RESPONSE =
  "Thank you for reaching out! I want to make sure I fully understand your concern. Could you tell me a bit more about what you're experiencing?";

export default function LiveChat({
  orderContext,
  isOpen: externalIsOpen,
  onOpenChange,
  onReturnClick,
}: LiveChatProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline] = useState(true);
  const [stage, setStage] = useState<ConversationStage>("greeting");
  const [previousMessages, setPreviousMessages] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasRestoredRef = useRef(false);

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange ?? setInternalIsOpen;

  // ─── Session storage persistence ──────────────────────────────────────────
  const storageKey = orderContext
    ? `livechat_${orderContext.orderId}`
    : "livechat_general";

  // Restore messages from sessionStorage on mount (regardless of isOpen)
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as {
          messages: Message[];
          stage: ConversationStage;
          previousMessages: string[];
        };
        const restored = parsed.messages.map((m) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
        setMessages(restored);
        setStage(parsed.stage);
        setPreviousMessages(parsed.previousMessages);
      }
    } catch {
      // Corrupted storage — ignore and start fresh
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Save messages to sessionStorage on every change
  useEffect(() => {
    if (messages.length === 0) return;
    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({ messages, stage, previousMessages }),
      );
    } catch {
      // Storage full or unavailable — silently ignore
    }
  }, [messages, stage, previousMessages, storageKey]);

  // Reset conversation when user explicitly closes chat (X button)
  const handleSetIsOpen = useCallback(
    (value: boolean) => {
      if (!value) {
        setMessages([]);
        setInputMessage("");
        setIsTyping(false);
        setStage("greeting");
        setPreviousMessages([]);
        setIsMinimized(false);
        hasRestoredRef.current = false;
        try {
          sessionStorage.removeItem(storageKey);
        } catch {}
      }
      setIsOpen(value);
    },
    [setIsOpen, storageKey],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize with order context greeting when chat opens (skip if restored from storage)
  useEffect(() => {
    if (!orderContext || !isOpen || messages.length > 0) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: `Hi! I need help with order #${orderContext.orderId}.${
        orderContext.productName ? ` The product is "${orderContext.productName}".` : ""
      } Can you assist me?`,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages([userMsg]);

    setTimeout(() => {
      const itemCount = orderContext.order.items.length;
      const total = parseFloat(orderContext.order.finalAmount).toFixed(2);

      // Categorize items by their current status
      const itemsWithReturn = orderContext.order.items.filter((item: any) => item.returnInfo);
      const itemsWithExchange = orderContext.order.items.filter((item: any) => item.exchangeInfo);
      const itemsWithNoRequest = orderContext.order.items.filter(
        (item: any) => !item.returnInfo && !item.exchangeInfo,
      );

      let greetingText = `I can see you need help with order #${orderContext.orderId}. It contains ${itemCount} item(s) totalling ₹${total}.\n\n`;

      // Show per-item status
      if (itemsWithExchange.length > 0 || itemsWithReturn.length > 0) {
        greetingText += `📋 Here's the status of your items:\n`;
        orderContext.order.items.forEach((item: any) => {
          const name = item.product?.name || "Item";
          if (item.exchangeInfo) {
            greetingText += `• ${name} — Exchange ${item.exchangeInfo.status}\n`;
          } else if (item.returnInfo) {
            greetingText += `• ${name} — Return ${item.returnInfo.status}\n`;
          } else {
            greetingText += `• ${name} — No active request\n`;
          }
        });
        greetingText += `\nHow can I help you?`;
      } else {
        greetingText += `How can I help you today?`;
      }

      const supportMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: greetingText,
        sender: "support",
        timestamp: new Date(),
        showQuickActions: true,
      };
      setMessages((prev) => [...prev, supportMsg]);
    }, 800);
  }, [orderContext, isOpen, messages.length]);

  // ─── Response logic ────────────────────────────────────────────────────────

  const getResponse = useCallback(
    (userInput: string): { text: string; actionType?: Message["actionType"] } => {
      const input = userInput.toLowerCase();

      // Escalation — check first so it's never unreachable
      if (input.includes("human") || input.includes("agent") || input.includes("talk to")) {
        return {
          text: "I understand you'd like to speak with a human agent. 😊 Let me connect you with one of our specialist team members. The wait time is typically less than 2 minutes. Is there anything I can clarify while you wait?",
        };
      }

      if (orderContext) {
        // Check for active return/exchange per item
        const itemsWithReturn = orderContext.order.items.filter((item: any) => item.returnInfo);
        const itemsWithExchange = orderContext.order.items.filter((item: any) => item.exchangeInfo);
        const itemsWithNoRequest = orderContext.order.items.filter(
          (item: any) => !item.returnInfo && !item.exchangeInfo,
        );

        // If user asks about status/tracking — show per-item breakdown
        if (input.includes("status") || input.includes("track")) {
          if (itemsWithExchange.length > 0 || itemsWithReturn.length > 0) {
            let statusText = "Here's the current status of your items:\n\n";
            itemsWithExchange.forEach((item: any) => {
              statusText += `🔄 ${item.product?.name || "Item"} — Exchange: ${item.exchangeInfo.status}\n`;
            });
            itemsWithReturn.forEach((item: any) => {
              statusText += `↩️ ${item.product?.name || "Item"} — Return: ${item.returnInfo.status}\n`;
            });
            if (itemsWithNoRequest.length > 0) {
              itemsWithNoRequest.forEach((item: any) => {
                statusText += `✅ ${item.product?.name || "Item"} — No active request\n`;
              });
            }
            statusText += "\nIs there anything specific I can help with?";
            return { text: statusText, actionType: "track" };
          }
          return {
            text: `Let me check the status of order #${orderContext.orderId} for you. 📦 Your package with ${orderContext.order.items.length} item(s) is currently in transit. You should receive it within 2–3 business days.`,
            actionType: "track",
          };
        }

        // If user asks about return/refund but items already have active return
        if (input.includes("return") || input.includes("refund")) {
          if (itemsWithReturn.length > 0 && itemsWithNoRequest.length === 0) {
            // All items already have returns
            let text = "All items in this order already have a return in progress:\n\n";
            itemsWithReturn.forEach((item: any) => {
              text += `• ${item.product?.name || "Item"} — ${item.returnInfo.status}\n`;
            });
            text += "\nWould you like to know the refund timeline, or is there something else I can help with?";
            return { text, actionType: "track" };
          }
          if (itemsWithReturn.length > 0 && itemsWithNoRequest.length > 0) {
            // Some items have returns, some don't
            let text = "Some items already have a return in progress:\n\n";
            itemsWithReturn.forEach((item: any) => {
              text += `• ${item.product?.name || "Item"} — ${item.returnInfo.status}\n`;
            });
            text += `\nYou can still initiate a return for: ${itemsWithNoRequest.map((i: any) => i.product?.name || "item").join(", ")}. Would you like to proceed?`;
            return { text, actionType: "return" };
          }
          return {
            text: "I'd be happy to help with your return! Our return policy has you covered. 💪 Just let me know if you're returning all items or specific pieces and I'll initiate the process right away.",
            actionType: "return",
          };
        }

        // If user asks about exchange/size but items already have active exchange
        if (input.includes("size") || input.includes("fit") || input.includes("exchange")) {
          if (itemsWithExchange.length > 0 && itemsWithNoRequest.length === 0) {
            let text = "All items in this order already have an exchange in progress:\n\n";
            itemsWithExchange.forEach((item: any) => {
              text += `• ${item.product?.name || "Item"} — ${item.exchangeInfo.status}\n`;
            });
            text += "\nThe replacement will be shipped once we receive the original. Anything else I can help with?";
            return { text, actionType: "track" };
          }
          if (itemsWithExchange.length > 0 && itemsWithNoRequest.length > 0) {
            let text = "Some items already have an exchange in progress:\n\n";
            itemsWithExchange.forEach((item: any) => {
              text += `• ${item.product?.name || "Item"} — ${item.exchangeInfo.status}\n`;
            });
            text += `\nYou can still exchange: ${itemsWithNoRequest.map((i: any) => i.product?.name || "item").join(", ")}. Would you like to proceed?`;
            return { text, actionType: "exchange" };
          }
          return {
            text:
              stage === "greeting"
                ? "Size issues are common — don't worry! 👍 I can help you exchange this for a different size. Which size would you prefer?"
                : "Getting the right size is important. Let me help with the exchange process. Do you know what size you'd like to try?",
            actionType: "exchange",
          };
        }

        if (input.includes("cancel") && (itemsWithReturn.length > 0 || itemsWithExchange.length > 0)) {
          return {
            text: `I understand you'd like to cancel your request. 🤔 Please note that cancellation depends on the current processing stage. Would you like me to connect you with a human agent who can assist with this?`,
          };
        }

        if (input.includes("quality") || input.includes("damaged") || input.includes("defect")) {
          if (itemsWithNoRequest.length === 0) {
            return {
              text: "All items in this order already have an active return or exchange. If you're experiencing a different issue, I'd recommend speaking with a human agent. Would you like me to connect you?",
            };
          }
          return {
            text:
              stage === "greeting"
                ? "I'm really sorry to hear about the quality issue! 😔 That's not the experience we want. I can initiate a return or exchange for you — which would you prefer?"
                : "I understand how frustrating quality issues can be. I can process a return request immediately, or arrange an exchange if you'd prefer. What works best for you?",
            actionType: "return",
          };
        }
        if (input.includes("wrong") || input.includes("incorrect")) {
          return {
            text: "Receiving the wrong item is not acceptable — I'm so sorry! 😅 I'll arrange for the correct item to be sent and we'll pick up the wrong one at no cost. Shall I process this now?",
            actionType: "exchange",
          };
        }
        if (input.includes("delivery") || input.includes("shipping") || input.includes("tracking")) {
          return {
            text: `Let me check the status of order #${orderContext.orderId} for you. � Your package with ${orderContext.order.items.length} item(s) is currently in transit. You should receive it within 2–3 business days.`,
            actionType: "track",
          };
        }
        if (input.includes("cancel")) {
          return {
            text: `Let me check the cancellation options for order #${orderContext.orderId}. 🤔 Depending on the processing stage, we may be able to cancel immediately. What would work best for you?`,
            actionType: "cancel",
          };
        }
      }

      // General responses by stage
      if (stage === "greeting") {
        if (input.includes("order") || input.includes("delivery")) {
          return {
            text: "Hello! 👋 I'd be happy to help with your order. Could you share your order number, or are you already looking at it?",
          };
        }
        if (input.includes("return") || input.includes("refund")) {
          return {
            text: "Hi there! Returns are no problem at all. 😊 Are you looking to return something from a recent order? I can guide you through the whole process!",
          };
        }
        if (input.includes("payment") || input.includes("billing")) {
          return {
            text: "Hello! Payment issues can be stressful, but I'm here to help. 💳 What specific payment concern are you having?",
          };
        }
        return {
          text: "Hi there! 👋 Welcome to Urumi support! I'm here to help with orders, returns, products — you name it. What can I assist you with today?",
        };
      }

      // Follow-up stage
      if (previousMessages.length > 2) {
        return {
          text: "I'm here until we get this completely sorted out! 😊 Is there anything else I can clarify for you?",
        };
      }

      return { text: FALLBACK_RESPONSE };
    },
    [orderContext, stage, previousMessages.length],
  );

  // Typing delay: 800ms base + small per-char component, capped at 2.5s
  const getTypingDelay = (messageLength: number): number =>
    Math.min(800 + messageLength * 8, 2500);

  const dispatchUserMessage = useCallback(
    (text: string) => {
      const userMsg: Message = {
        id: Date.now().toString(),
        text,
        sender: "user",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setPreviousMessages((prev) => [...prev, text]);
      setIsTyping(true);

      const { text: responseText, actionType } = getResponse(text);
      const delay = getTypingDelay(responseText.length);

      setTimeout(() => {
        const supportMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: responseText,
          sender: "support",
          timestamp: new Date(),
          showActionButtons: actionType !== undefined,
          actionType,
        };
        setMessages((prev) => [...prev, supportMsg]);
        setIsTyping(false);
        setStage((prev) => (prev === "greeting" ? "understanding" : "resolving"));
      }, delay);
    },
    [getResponse],
  );

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    dispatchUserMessage(inputMessage.trim());
    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ─── Action buttons ────────────────────────────────────────────────────────

  const handleAction = (action: "return" | "exchange" | "track" | "cancel") => {
    if (!orderContext) return;

    if (action === "return" || action === "exchange") {
      if (!onReturnClick) return;
      // Pick the first item that is eligible for the requested action
      const eligibleItem = orderContext.order.items.find((item: any) =>
        action === "return"
          ? item.returnEligibility?.eligible
          : item.exchangeEligibility?.eligible,
      );
      if (eligibleItem) {
        onReturnClick(eligibleItem.id, action);
        handleSetIsOpen(false);
      } else {
        // No eligible item — inform the user instead of silently doing nothing
        dispatchUserMessage(
          action === "return"
            ? "I want to return an item but none seem eligible"
            : "I want to exchange an item but none seem eligible",
        );
      }
      return;
    }

    // track / cancel — scroll to top of current page (user is already here)
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (!isOpen) {
    return (
      <Button
        onClick={() => handleSetIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 touch-manipulation active:scale-95"
        size="icon"
        aria-label="Open support chat"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 bg-white rounded-lg shadow-xl border border-gray-200 transition-all duration-300 flex flex-col ${
        isMinimized
          ? "w-80 h-14"
          : "w-80 sm:w-96 h-[560px] max-h-[80vh]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-slate-900 text-white rounded-t-lg flex-shrink-0">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-5 w-5" />
          <div>
            <h3 className="font-semibold text-sm">Customer Support</h3>
            <p className="text-xs opacity-80">
              {isOnline ? "Online · Available now" : "Offline · Leave a message"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized((v) => !v)}
            className="h-8 w-8 text-white hover:bg-white/20"
            aria-label={isMinimized ? "Expand chat" : "Minimise chat"}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleSetIsOpen(false)}
            className="h-8 w-8 text-white hover:bg-white/20"
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="font-medium text-gray-900 mb-2 text-sm">
                  {orderContext
                    ? `Help with Order #${orderContext.orderId}`
                    : "How can I help you today?"}
                </h4>
                <p className="text-xs text-gray-500">
                  {orderContext
                    ? `I'm here to help with your order containing ${orderContext.order.items.length} item(s). What issue are you experiencing?`
                    : "I'm here to assist with orders, returns, payments, and any other questions."}
                </p>
                {orderContext && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg text-left">
                    <p className="text-xs font-medium text-gray-700 mb-1">Order Details</p>
                    <p className="text-xs text-gray-600">Order ID: #{orderContext.orderId}</p>
                    <p className="text-xs text-gray-600">Items: {orderContext.order.items.length}</p>
                    <p className="text-xs text-gray-600">
                      Total: ₹{parseFloat(orderContext.order.finalAmount).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={message.id} className="space-y-2">
                  <div
                    className={`flex gap-2 ${
                      message.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.sender === "support" && (
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="h-4 w-4 text-slate-600" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                        message.sender === "user"
                          ? "bg-slate-900 text-white rounded-br-sm"
                          : "bg-gray-100 text-gray-900 rounded-bl-sm"
                      }`}
                    >
                      <p className="text-xs leading-relaxed">{message.text}</p>
                      <p
                        className={`text-[10px] mt-1 ${
                          message.sender === "user" ? "text-slate-400" : "text-gray-400"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {message.sender === "user" && (
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                  </div>

                  {/* Quick action chips — only on last support message */}
                  {message.sender === "support" &&
                    message.showQuickActions &&
                    index === messages.length - 1 && (
                      <div className="flex flex-wrap gap-2 ml-9">
                        {(() => {
                          if (!orderContext) {
                            return [
                              { label: "Order Help", text: "I need help with my order" },
                              { label: "Return/Exchange", text: "I want to return or exchange" },
                              { label: "Payment Issue", text: "I have a payment issue" },
                              { label: "Other", text: "Other issue" },
                            ];
                          }

                          const itemsWithReturn = orderContext.order.items.filter((item: any) => item.returnInfo);
                          const itemsWithExchange = orderContext.order.items.filter((item: any) => item.exchangeInfo);
                          const itemsWithNoRequest = orderContext.order.items.filter(
                            (item: any) => !item.returnInfo && !item.exchangeInfo,
                          );

                          const chips: { label: string; text: string }[] = [];

                          // Chips for items with active requests
                          if (itemsWithExchange.length > 0) {
                            const names = itemsWithExchange.map((i: any) => i.product?.name || "item").join(", ");
                            chips.push({ label: "Track Exchange", text: `What's the exchange status for ${names}?` });
                          }
                          if (itemsWithReturn.length > 0) {
                            const names = itemsWithReturn.map((i: any) => i.product?.name || "item").join(", ");
                            chips.push({ label: "Track Return", text: `What's the return status for ${names}?` });
                            chips.push({ label: "Refund Timeline", text: "When will I get my refund?" });
                          }

                          // Chips for items without active requests (eligible for new actions)
                          if (itemsWithNoRequest.length > 0) {
                            chips.push({ label: "Quality Issue", text: "The product quality is not good" });
                            chips.push({ label: "Wrong Size", text: "I received the wrong size" });
                            chips.push({ label: "Return Item", text: "I want to return an item" });
                          }

                          // Always available
                          chips.push({ label: "Talk to Human", text: "Connect me to a human agent" });

                          return chips;
                        })().map(({ label, text }) => (
                          <button
                            key={label}
                            onClick={() => dispatchUserMessage(text)}
                            className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-full hover:bg-gray-50 hover:border-gray-400 transition-colors"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}

                  {/* Action buttons — only on last support message */}
                  {message.sender === "support" &&
                    message.showActionButtons &&
                    index === messages.length - 1 && (
                      <div className="flex flex-wrap gap-2 ml-9">
                        {message.actionType === "return" && (
                          <>
                            <button
                              onClick={() => handleAction("return")}
                              className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors font-medium"
                            >
                              Initiate Return
                            </button>
                            <button
                              onClick={() => dispatchUserMessage("How long will the refund take?")}
                              className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                            >
                              Refund Timeline
                            </button>
                          </>
                        )}
                        {message.actionType === "exchange" && (
                          <button
                            onClick={() => handleAction("exchange")}
                            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors font-medium"
                          >
                            Exchange Item
                          </button>
                        )}
                        {message.actionType === "track" && (
                          <button
                            onClick={() => handleAction("track")}
                            className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors font-medium"
                          >
                            View Tracking
                          </button>
                        )}
                        {message.actionType === "cancel" && (
                          <>
                            <button
                              onClick={() => handleAction("cancel")}
                              className="px-3 py-1.5 text-xs bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors font-medium"
                            >
                              Cancel Order
                            </button>
                            <button
                              onClick={() =>
                                dispatchUserMessage("Connect me to a human agent")
                              }
                              className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
                            >
                              Talk to Human
                            </button>
                          </>
                        )}
                      </div>
                    )}
                </div>
              ))
            )}

            {isTyping && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-slate-600" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                    <div
                      className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.15s" }}
                    />
                    <div
                      className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.3s" }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t flex-shrink-0">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message…"
                className="flex-1 text-sm"
                disabled={!isOnline || isTyping}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || !isOnline || isTyping}
                size="icon"
                className="active:scale-95 flex-shrink-0"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {!isOnline && (
              <p className="text-xs text-gray-500 mt-2">
                Support is currently offline. Your message will be saved and you'll receive a
                response via email.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
