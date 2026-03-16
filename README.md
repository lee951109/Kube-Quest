# 🚀 Kube-Quest: Cloud-Native Real-Time Mini-Game Platform

## 📌 프로젝트 소개
**Kube-Quest**는 단순한 웹 게임을 넘어, 현대적인 **클라우드 네이티브 아키텍처**와 **관측 가능성(Observability)**을 실증하기 위해 기획된 실시간 서버 상태 연동 미니 게임 플랫폼입니다.

이 프로젝트는 트래픽과 서버 지표(CPU, Memory 등)를 게임 내 요소로 시각화하여, 백엔드 시스템의 상태를 유저가 직관적으로 경험할 수 있도록 설계되었습니다. 안정적인 API 제공부터 실시간 양방향 통신, 그리고 컨테이너 기반의 배포 및 모니터링 파이프라인 구축까지 전체 시스템의 라이프사이클을 다룹니다.

## 🛠️ 기술 스택 (Tech Stack)

### Backend
* **Framework:** Node.js, NestJS
* **Language:** TypeScript
* **ORM:** TypeORM

### Database & Cache
* **RDBMS:** PostgreSQL (User & Game Data)
* **In-Memory/Cache:** Redis (Real-time Ranking & Session Management)

### Real-Time Communication
* **WebSocket:** Socket.io

### DevOps & Infrastructure (Planned)
* **Containerization:** Docker, Docker Compose
* **Orchestration:** Kubernetes (EKS/Minikube)
* **Monitoring:** Prometheus
* **Cloud:** AWS

## ⚙️ 핵심 기능 및 아키텍처 목표 (Features & Architecture)

1. **도메인 주도 설계(DDD) 기반의 구조화된 백엔드**
   * NestJS의 모듈 시스템을 활용하여 유저, 게임 로직, 실시간 통신 도메인을 분리하고 유지보수성을 극대화합니다.
2. **실시간 데이터 처리 (Socket.io & Redis)**
   * 다수의 유저가 동시에 상호작용하는 환경을 구축하고, Redis를 활용해 서버 간 상태 공유 및 실시간 랭킹 시스템을 구현합니다.
3. **인프라의 코드화 (IaC) 및 컨테이너 환경**
   * 로컬 개발 환경부터 배포 환경까지 `docker-compose` 및 `Dockerfile`을 통해 일관된 실행 환경을 보장합니다.
4. **Prometheus를 활용한 메트릭 시각화**
   * 서버의 실제 부하 상태와 성능 지표를 수집하여 게임 내의 난이도나 이벤트 발생 조건으로 연동합니다.

## 🚀 시작하기 (Getting Started)

### 1. 요구 사항 (Prerequisites)
* Node.js (v18 LTS 이상 권장)
* Docker Desktop

### 2. 로컬 환경 실행 방법 (Local Setup)

```bash
# 1. 패키지 설치
$ npm install

# 2. 인프라 실행 (PostgreSQL 컨테이너 실행)
$ docker-compose up -d

# 3. 애플리케이션 실행 (개발 모드)
$ npm run start:dev
```

### 3. API 엔드포인트 테스트
서버가 정상적으로 실행되면 http://localhost:3000 에서 API를 확인할 수 있습니다.

**Author**: Lee Ji-hyun