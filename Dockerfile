
FROM node:24-alpine

# 컨테이너 내부에서 작업할 폴더 지정
WORKDIR /app

# 패키지 목록 먼저 복사 후 의존성 설치
COPY package*.json ./
RUN npm install 

# 모든 코드를 컨테이너 안으로 복사
COPY . .

# TS 코드를 JS로 빌드
RUN npm run build

# 3000번 포트로 통신
EXPOSE 3000

# 컨테이너가 켜질 때 실행 명령어
CMD ["npm", "run", "start:prod"]

