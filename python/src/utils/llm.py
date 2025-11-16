

from browser_use.llm import BaseChatModel
from browser_use.llm.openai.chat import ChatOpenAI
from browser_use.llm.anthropic.chat import ChatAnthropic
from browser_use.llm.google.chat import ChatGoogle
from browser_use.llm.deepseek.chat import ChatDeepSeek
from browser_use.llm.openrouter.chat import ChatOpenRouter
from browser_use.llm.groq.chat import ChatGroq
from browser_use.llm.ollama.chat import ChatOllama
from browser_use.llm.azure.chat import ChatAzureOpenAI
from browser_use.llm.aws.chat_bedrock import ChatAWSBedrock
from browser_use.llm.aws.chat_anthropic import ChatAnthropicBedrock
from typing import Optional


def get_llm(provider: str, model: str, temperature: float, base_url: str, max_tokens: int, api_key: Optional[str] = None) -> BaseChatModel:
    print(f"Getting LLM for provider: {provider}, model: {model}")
    print(f"Base URL provided: {base_url}")
    print(f"API key provided: {'Yes' if api_key else 'No'}")
    print(f"Api key is {api_key}")

    if provider == "openai":
        llm = ChatOpenAI(
            model=model,
            temperature=temperature,
            base_url=base_url if base_url else None,
            max_completion_tokens=max_tokens,
            api_key=api_key,
        )
    elif provider == "anthropic":
        llm = ChatAnthropic(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            base_url=base_url if base_url else None,
            timeout=600,
            api_key=api_key,
        )
    elif provider == "google":
        llm = ChatGoogle(
            model=model, 
            temperature=temperature,
            api_key=api_key,
        )            
    elif provider == "deepseek":
        print("Creating DeepSeek LLM instance")
        print(f"DeepSeek API key provided: {'Yes' if api_key else 'No'}")
        llm = ChatDeepSeek(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            base_url=base_url if base_url else "https://api.deepseek.com/v1",
            api_key=api_key,
        )
    elif provider == "openrouter":
        llm = ChatOpenRouter(
            model=model,
            temperature=temperature,
            base_url=base_url if base_url else "https://openrouter.ai/api/v1",
            api_key=api_key,
        )
    elif provider == "groq":
        llm = ChatGroq(
            model=model,
            temperature=temperature,
            base_url=base_url if base_url else None,
            api_key=api_key,
        )
    elif provider == "ollama":
        llm = ChatOllama(
            model=model,
            host=base_url if base_url else None,
            # Note: Ollama doesn't use temperature or api_key in the same way
        )
    elif provider == "azure":
        llm = ChatAzureOpenAI(
            model=model,
            api_key=api_key,
            azure_endpoint=base_url,
            # Azure OpenAI inherits from ChatOpenAILike, so parameters may vary
        )
    elif provider == "aws-bedrock":
        llm = ChatAWSBedrock(
            model=model,
            # AWS Bedrock uses AWS credentials, not API key in the traditional sense
            # Configuration depends on AWS SDK setup
        )
    elif provider == "aws-anthropic":
        llm = ChatAnthropicBedrock(
            model=model,
            # AWS Anthropic Bedrock uses AWS credentials
        )
    else:
        raise ValueError(f"Unknown provider: {provider}")
    print(f"LLM created successfully: {type(llm)}")
    return llm