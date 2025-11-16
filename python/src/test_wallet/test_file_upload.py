import asyncio
import os
import tempfile
from browser_use import Agent, ChatOpenAI

# Create a test file to upload
test_file_path = os.path.join(os.path.dirname(__file__), "test_upload.txt")
with open(test_file_path, "w") as f:
    f.write("This is a test file for upload verification.\nRandom content: 12345")

task = f"""
Go to https://www.w3schools.com/html/tryit.asp?filename=tryhtml_input_file
Find the file input element (it has type="file" and id="myfile")
Upload the file located at {test_file_path}
Then check that the file was uploaded successfully by looking at the file input value or any feedback.
Report the result.
""".strip()

llm = ChatOpenAI(model='gpt-4o-mini', api_key="REDACTED_OPENAI_KEY")

agent = Agent(
    task=task,
    llm=llm,
    available_file_paths=[test_file_path],  # Make the file available for upload
)

async def main():
    try:
        agent_history = await agent.run()
        print(f'Final result: {agent_history.final_result()}', flush=True)
    except Exception as e:
        print(f'Error: {e}')

if __name__ == "__main__":
    asyncio.run(main())