#!/bin/bash
set -e

echo "=== Viral Clipper — Mac Setup ==="
echo ""

# Check for Homebrew
if ! command -v brew &> /dev/null; then
    echo "ERROR: Homebrew not found. Install it first:"
    echo '  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
    exit 1
fi

# Install FFmpeg
echo "[1/5] Installing FFmpeg..."
if command -v ffmpeg &> /dev/null; then
    echo "  FFmpeg already installed: $(ffmpeg -version 2>&1 | head -1)"
else
    brew install ffmpeg
    echo "  FFmpeg installed."
fi

# Install Python dependencies
echo ""
echo "[2/5] Installing Python dependencies..."
pip install -r requirements.txt
pip install playwright
echo "  Dependencies installed."

# Install WhisperX (CPU mode)
echo ""
echo "[3/5] Installing WhisperX + PyTorch (CPU)..."
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu 2>/dev/null || \
    pip install torch torchaudio
pip install whisperx
echo "  WhisperX installed."

# Install Playwright browsers
echo ""
echo "[4/5] Installing Playwright Chromium browser..."
playwright install chromium
echo "  Playwright Chromium installed."

# Create directories
echo ""
echo "[5/5] Setting up project directories..."
mkdir -p data storage output

# Copy .env if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    # Generate an encryption key automatically
    FERNET_KEY=$(python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^ENCRYPTION_KEY=.*|ENCRYPTION_KEY=${FERNET_KEY}|" .env
    else
        sed -i "s|^ENCRYPTION_KEY=.*|ENCRYPTION_KEY=${FERNET_KEY}|" .env
    fi
    echo "  Created .env with auto-generated encryption key."
    echo ""
    echo "  IMPORTANT: Edit .env and add your Claude API key:"
    echo "    CLAUDE_API_KEY=sk-ant-your-key-here"
else
    echo "  .env already exists, skipping."
fi

# Initialize database
echo ""
echo "Initializing database..."
python -m src.cli init-db

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Add your Claude API key to .env"
echo "  2. Test the pipeline: python -m src.cli process-folder ./media/ --output ./output/"
echo "  3. Add accounts:      python -m src.cli add-account"
echo ""
