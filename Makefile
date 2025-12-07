# AITuberKit Makefile
# ChromaDB + Next.js 開発環境の一括管理

.PHONY: dev stop chromadb rag-load status help

# デフォルトターゲット
.DEFAULT_GOAL := help

# 設定
CHROMADB_CONTAINER_NAME := chromadb
CHROMADB_PORT := 8000
DEV_PORT := 3000

#===============================================================================
# メインコマンド
#===============================================================================

## dev: ChromaDBを起動してから開発サーバーを起動
dev: chromadb-ensure
	@echo "🚀 Starting development server..."
	@if lsof -i :$(DEV_PORT) -P >/dev/null 2>&1; then \
		echo "⚠️  Port $(DEV_PORT) is already in use. Server may already be running."; \
		echo "   Run 'make status' to check, or 'make stop' to stop existing processes."; \
	else \
		npm run dev; \
	fi

## stop: 開発サーバーとChromaDBを停止
stop:
	@echo "🛑 Stopping services..."
	@# Next.js dev serverを停止（ポート3000-3010をチェック）
	@for port in 3000 3001 3002 3003 3004 3005; do \
		pid=$$(lsof -ti :$$port 2>/dev/null); \
		if [ -n "$$pid" ]; then \
			echo "   Stopping process on port $$port (PID: $$pid)"; \
			kill $$pid 2>/dev/null || true; \
		fi; \
	done
	@# ChromaDBコンテナを停止
	@if docker ps -q -f name=$(CHROMADB_CONTAINER_NAME) 2>/dev/null | grep -q .; then \
		echo "   Stopping ChromaDB container..."; \
		docker stop $(CHROMADB_CONTAINER_NAME) >/dev/null 2>&1 || true; \
	fi
	@echo "✅ All services stopped"

## chromadb: ChromaDBコンテナを起動
chromadb:
	@echo "🗄️  Starting ChromaDB..."
	@if docker ps -q -f name=$(CHROMADB_CONTAINER_NAME) 2>/dev/null | grep -q .; then \
		echo "✅ ChromaDB is already running"; \
	else \
		if docker ps -aq -f name=$(CHROMADB_CONTAINER_NAME) 2>/dev/null | grep -q .; then \
			echo "   Starting existing container..."; \
			docker start $(CHROMADB_CONTAINER_NAME) >/dev/null; \
		else \
			echo "   Creating new container..."; \
			docker run -d -p $(CHROMADB_PORT):8000 --name $(CHROMADB_CONTAINER_NAME) chromadb/chroma >/dev/null; \
		fi; \
		echo "✅ ChromaDB started on port $(CHROMADB_PORT)"; \
	fi

## chromadb-ensure: ChromaDBが起動していることを確認（内部用）
chromadb-ensure:
	@if ! docker ps -q -f name=$(CHROMADB_CONTAINER_NAME) 2>/dev/null | grep -q .; then \
		$(MAKE) chromadb; \
	fi

## rag-load: knowledgeディレクトリのドキュメントをChromaDBに登録
rag-load: chromadb-ensure
	@echo "📚 Loading RAG documents..."
	@if [ ! -d "./knowledge" ]; then \
		echo "❌ Error: ./knowledge directory not found"; \
		echo "   Create the directory and add .txt or .md files"; \
		exit 1; \
	fi
	npm run rag:load ./knowledge

## status: サービスの状態を確認
status:
	@echo "📊 Service Status"
	@echo "================"
	@echo ""
	@echo "🗄️  ChromaDB:"
	@if docker ps -q -f name=$(CHROMADB_CONTAINER_NAME) 2>/dev/null | grep -q .; then \
		echo "   ✅ Running (port $(CHROMADB_PORT))"; \
	elif docker ps -aq -f name=$(CHROMADB_CONTAINER_NAME) 2>/dev/null | grep -q .; then \
		echo "   ⏸️  Stopped (container exists)"; \
	else \
		echo "   ❌ Not running (no container)"; \
	fi
	@echo ""
	@echo "🌐 Next.js Dev Server:"
	@for port in 3000 3001 3002 3003; do \
		if lsof -i :$$port -P -sTCP:LISTEN >/dev/null 2>&1; then \
			pid=$$(lsof -ti :$$port -sTCP:LISTEN 2>/dev/null | head -1); \
			echo "   ✅ Running on port $$port (PID: $$pid)"; \
		fi; \
	done
	@if ! lsof -i :3000-3003 -P >/dev/null 2>&1; then \
		echo "   ❌ Not running"; \
	fi
	@echo ""

## help: ヘルプを表示
help:
	@echo "AITuberKit Development Commands"
	@echo "================================"
	@echo ""
	@echo "Usage: make <command>"
	@echo ""
	@echo "Commands:"
	@echo "  dev       ChromaDBを起動して開発サーバーを起動"
	@echo "  stop      開発サーバーとChromaDBを停止"
	@echo "  chromadb  ChromaDBのみ起動"
	@echo "  rag-load  knowledgeディレクトリのドキュメントを登録"
	@echo "  status    サービスの状態を確認"
	@echo "  help      このヘルプを表示"
	@echo ""
