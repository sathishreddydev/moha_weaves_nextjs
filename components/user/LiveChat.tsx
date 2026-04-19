"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MessageCircle, 
  X, 
  Send, 
  Minimize2, 
  Maximize2,
  User,
  Bot
} from "lucide-react";
import { OrderWithItems } from "@/shared";

interface Message {
  id: string;
  text: string;
  sender: "user" | "support";
  timestamp: Date;
  isTyping?: boolean;
  showQuickActions?: boolean;
  showActionButtons?: boolean;
  actionType?: "return" | "exchange" | "track" | "cancel";
}

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

export default function LiveChat({ orderContext, isOpen: externalIsOpen, onOpenChange, onReturnClick }: LiveChatProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [conversationContext, setConversationContext] = useState<{
    stage: 'greeting' | 'understanding' | 'resolving' | 'followup';
    issueType?: string;
    itemIndex?: number;
    previousMessages: string[];
  }>({
    stage: 'greeting',
    previousMessages: []
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with order context if provided
  useEffect(() => {
    if (orderContext && isOpen && messages.length === 0) {
      const contextMessage: Message = {
        id: Date.now().toString(),
        text: `Hi! I need help with order #${orderContext.orderId}. ${orderContext.productName ? `The product is "${orderContext.productName}".` : ''} Can you assist me?`,
        sender: "user",
        timestamp: new Date(),
      };
      
      setMessages([contextMessage]);
      
      // Auto-trigger support response
      setTimeout(() => {
        const itemCount = orderContext.order.items.length;
        const totalAmount = parseFloat(orderContext.order.finalAmount).toFixed(2);
        const supportResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: `I can see you need help with order #${orderContext.orderId}. I have your order details open - it contains ${itemCount} item(s) totaling ₹${totalAmount}. How can I help you with this order today?`,
          sender: "support",
          timestamp: new Date(),
          showQuickActions: true,
        };
        setMessages(prev => [...prev, supportResponse]);
      }, 1000);
    }
  }, [orderContext, isOpen, messages.length]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);
    updateConversationContext(inputMessage);

    // Enhanced realistic response
    const response = getEnhancedResponse(inputMessage);
    const delay = getRealisticTypingDelay(response.length);
    
    setTimeout(() => {
      const supportResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: "support",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, supportResponse]);
      setIsTyping(false);
      
      // Update conversation stage
      setConversationContext(prev => ({
        ...prev,
        stage: prev.stage === 'greeting' ? 'understanding' : 'resolving'
      }));
    }, delay);
  };

  const getEnhancedResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    const { stage, previousMessages } = conversationContext;
    
    // Context-aware responses based on conversation stage
    if (orderContext) {
      if (input.includes("quality") || input.includes("damaged") || input.includes("defect")) {
        if (stage === 'greeting') {
          return "Oh no, I'm really sorry to hear about the quality issue with your order! 😔 That's definitely not the experience we want for our customers. Let me help you sort this out right away. I can initiate a return or exchange for you - which would you prefer?";
        } else {
          return "I understand how frustrating quality issues can be. Don't worry, we'll make this right for you! I can process a return request immediately, or if you'd like to try the same item again, I can help with an exchange. What works best for you?";
        }
      } else if (input.includes("size") || input.includes("fit") || input.includes("exchange")) {
        if (stage === 'greeting') {
          return "Size issues are so common, don't worry! We'll get you the perfect fit. 👍 I can help you exchange this for a different size. Just to confirm - which size would you prefer instead? I can also check availability for you.";
        } else {
          return "Absolutely! Getting the right size is crucial for loving your purchase. Let me help you with the exchange process. Do you know what size you'd like to try, or would you like me to suggest the best size based on your measurements?";
        }
      } else if (input.includes("wrong") || input.includes("incorrect")) {
        return "Oh my goodness, receiving the wrong item is definitely not acceptable! I'm so sorry this happened. 😅 Let me fix this immediately. I'll arrange for the correct item to be sent to you, and we'll pick up the wrong one at no cost. Shall I process this right now?";
      } else if (input.includes("delivery") || input.includes("shipping") || input.includes("tracking")) {
        return `Great question! Let me check the real-time status of order #${orderContext.orderId} for you. 📦 Your package with ${orderContext.order.items.length} item(s) is currently in transit. Based on the latest update, you should receive it within 2-3 business days. Would you like me to send you the tracking link?`;
      } else if (input.includes("return") || input.includes("refund")) {
        return "I'd be happy to help with your return! Our 30-day return policy has you covered. 💪 I can make this super easy for you - just let me know if you're returning all items or specific pieces, and I'll initiate the process right away. Refunds are typically processed within 5-7 business days once we receive the items.";
      } else if (input.includes("cancel")) {
        return "Let me check the cancellation options for order #" + orderContext.orderId + " right now. 🤔 Depending on the processing stage, we might be able to cancel immediately. If it's already being prepared for shipment, I can help you with a return once it arrives. What would work best for you?";
      }
    }
    
    // Context-aware general responses
    if (stage === 'greeting') {
      if (input.includes("order") || input.includes("delivery")) {
        return "Hello! 👋 I'd be happy to help with your order! To pull up your details quickly, could you share your order number? Or if you're already looking at your order, I can access it directly!";
      } else if (input.includes("return") || input.includes("refund")) {
        return "Hi there! Returns are no problem at all. 😊 Our 30-day policy makes it easy. Are you looking to return something from a recent order? I can guide you through the whole process!";
      } else if (input.includes("payment") || input.includes("billing")) {
        return "Hello! Payment issues can be stressful, but I'm here to help sort them out. 💳 What specific payment concern are you having? I'll make sure we get this resolved for you.";
      } else {
        return "Hi there! 👋 Welcome to Moha Weaves support! I'm here to help with anything you need - orders, returns, products, you name it! What can I assist you with today?";
      }
    } else {
      // Follow-up responses with personality
      if (previousMessages.length > 2) {
        return "I'm here to help until we get this completely sorted out! 😊 Is there anything else about your order or concern that I can clarify for you? Your satisfaction is my priority!";
      } else {
        return "Thank you for that information! I want to make sure I fully understand so I can give you the best help possible. Could you tell me a bit more about what you're experiencing?";
      }
    }
    
    // Handle escalation requests
    if (input.includes("human") || input.includes("agent") || input.includes("talk to")) {
      return "I understand you'd like to speak with a human agent. No problem at all! 😊 Let me connect you with one of our specialist team members who can provide more personalized assistance. The wait time is typically less than 2 minutes. In the meantime, is there anything else I can help clarify while you wait?";
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getRealisticTypingDelay = (messageLength: number): number => {
    // Base delay + typing speed variation
    const baseDelay = 1000; // 1 second minimum
    const typingSpeed = 50; // 50ms per character
    const variation = Math.random() * 1000; // 0-1 second random variation
    
    return baseDelay + (messageLength * typingSpeed) + variation;
  };

  const updateConversationContext = (userMessage: string) => {
    setConversationContext(prev => ({
      ...prev,
      previousMessages: [...prev.previousMessages, userMessage]
    }));
  };

  const handleQuickAction = (issue: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text: issue,
      sender: "user",
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);
    updateConversationContext(issue);

    // Simulate realistic support response
    const response = getEnhancedResponse(issue);
    const actionType = getActionType(issue);
    const delay = getRealisticTypingDelay(response.length);
    
    setTimeout(() => {
      const supportResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: "support",
        timestamp: new Date(),
        showActionButtons: actionType !== undefined,
        actionType,
      };
      setMessages(prev => [...prev, supportResponse]);
      setIsTyping(false);
      
      // Update conversation stage
      setConversationContext(prev => ({
        ...prev,
        stage: 'resolving',
        issueType: issue
      }));
    }, delay);
  };

  const getActionType = (issue: string): "return" | "exchange" | "track" | "cancel" | undefined => {
    const input = issue.toLowerCase();
    if (input.includes("return") || input.includes("quality")) return "return";
    if (input.includes("exchange") || input.includes("size")) return "exchange";
    if (input.includes("track") || input.includes("delivery")) return "track";
    if (input.includes("cancel")) return "cancel";
    return undefined;
  };

  const handleAction = (action: string) => {
    if (!orderContext) return;
    
    switch (action) {
      case "return":
        if (onReturnClick && orderContext.order.items.length > 0) {
          onReturnClick(orderContext.order.items[0].id, "return");
          setIsOpen(false);
        }
        break;
      case "exchange":
        if (onReturnClick && orderContext.order.items.length > 0) {
          onReturnClick(orderContext.order.items[0].id, "exchange");
          setIsOpen(false);
        }
        break;
      case "track":
        // Open tracking in new tab or navigate
        window.open(`/my/orders/${orderContext.orderId}`, "_blank");
        break;
      case "cancel":
        // Navigate to order page for cancellation
        window.open(`/my/orders/${orderContext.orderId}`, "_blank");
        break;
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 touch-manipulation active:scale-95"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 bg-white rounded-lg shadow-xl border border-gray-200 ${
      isMinimized ? "w-80 h-14" : "w-96 h-[600px] max-h-[80vh] sm:w-96 sm:h-[600px] xs:w-[calc(100vw-2rem)] xs:h-[70vh]"
    } transition-all duration-300 flex flex-col`}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b bg-primary-600 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-5 w-5" />
          <div>
            <h3 className="font-semibold">Customer Support</h3>
            <p className="text-xs opacity-90">
              {isOnline ? "Online - Available now" : "Offline - Leave a message"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8 text-white hover:bg-white/20"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="font-medium text-gray-900 mb-2">
                  {orderContext ? `Help with Order #${orderContext.orderId}` : "How can I help you today?"}
                </h4>
                <p className="text-sm text-gray-600">
                  {orderContext 
                    ? `I'm here to help with your order containing ${orderContext.order.items.length} item(s). What issue are you experiencing?`
                    : "I'm here to assist with orders, returns, payments, and any other questions you may have."
                  }
                </p>
                {orderContext && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg text-left">
                    <p className="text-xs font-medium text-gray-700 mb-1">Order Details:</p>
                    <p className="text-xs text-gray-600">Order ID: #{orderContext.orderId}</p>
                    <p className="text-xs text-gray-600">Items: {orderContext.order.items.length}</p>
                    <p className="text-xs text-gray-600">Total: ₹{parseFloat(orderContext.order.finalAmount).toFixed(2)}</p>
                  </div>
                )}
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={message.id} className="space-y-2">
                  <div
                    className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.sender === "support" && (
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary-600" />
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        message.sender === "user"
                          ? "bg-primary-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === "user" ? "text-primary-200" : "text-gray-500"
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {message.sender === "user" && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                  
                  {/* Quick Action Buttons */}
                  {message.sender === "support" && message.showQuickActions && index === messages.length - 1 && (
                    <div className="flex flex-wrap gap-2 mt-3 ml-11 max-w-[80%] xs:max-w-[70%] xs:ml-8">
                      <button
                        onClick={() => handleQuickAction("The product quality is not good")}
                        className="px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                      >
                        Quality Issue
                      </button>
                      <button
                        onClick={() => handleQuickAction("I received the wrong size")}
                        className="px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                      >
                        Wrong Size
                      </button>
                      <button
                        onClick={() => handleQuickAction("I received the wrong item")}
                        className="px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                      >
                        Wrong Item
                      </button>
                      <button
                        onClick={() => handleQuickAction("I want to track my delivery")}
                        className="px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                      >
                        Track Delivery
                      </button>
                      <button
                        onClick={() => handleQuickAction("I want to return this order")}
                        className="px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                      >
                        Return Order
                      </button>
                      <button
                        onClick={() => handleQuickAction("Other issue")}
                        className="px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                      >
                        Other
                      </button>
                    </div>
                  )}

                  {/* Action Buttons for Next Steps */}
                  {message.sender === "support" && message.showActionButtons && index === messages.length - 1 && (
                    <div className="flex flex-wrap gap-2 mt-3 ml-11 max-w-[80%] xs:max-w-[70%] xs:ml-8">
                      {message.actionType === "return" && (
                        <>
                          <button
                            onClick={() => handleAction("return")}
                            className="px-4 py-2 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                          >
                            Initiate Return
                          </button>
                          <button
                            onClick={() => handleQuickAction("What items are eligible for return?")}
                            className="px-4 py-2 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Return Policy
                          </button>
                          <button
                            onClick={() => handleQuickAction("How long will the refund take?")}
                            className="px-4 py-2 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Refund Timeline
                          </button>
                        </>
                      )}
                      {message.actionType === "exchange" && (
                        <>
                          <button
                            onClick={() => handleAction("exchange")}
                            className="px-4 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                          >
                            Exchange Item
                          </button>
                          <button
                            onClick={() => handleQuickAction("What sizes are available?")}
                            className="px-4 py-2 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Check Sizes
                          </button>
                        </>
                      )}
                      {message.actionType === "track" && (
                        <>
                          <button
                            onClick={() => handleAction("track")}
                            className="px-4 py-2 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                          >
                            Track Order
                          </button>
                          <button
                            onClick={() => handleQuickAction("When will my order arrive?")}
                            className="px-4 py-2 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            ETA Details
                          </button>
                        </>
                      )}
                      {message.actionType === "cancel" && (
                        <>
                          <button
                            onClick={() => handleAction("cancel")}
                            className="px-4 py-2 text-xs bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                          >
                            Cancel Order
                          </button>
                          <button
                            onClick={() => handleQuickAction("What is the cancellation policy?")}
                            className="px-4 py-2 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancellation Policy
                          </button>
                          <button
                            onClick={() => handleQuickAction("Connect me to a human agent")}
                            className="px-4 py-2 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary-600" />
                </div>
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1"
                disabled={!isOnline}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || !isOnline}
                size="icon"
                className="touch-manipulation active:scale-95"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {!isOnline && (
              <p className="text-xs text-gray-500 mt-2">
                Support is currently offline. Your message will be saved and you'll receive a response via email.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
