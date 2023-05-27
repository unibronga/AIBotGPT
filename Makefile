build:
	docker build -t bot_ai .

run:
	docker run -d -p 3000:3000 --name bot_ai --rm bot_ai

stop:
	docker stop bot_ai