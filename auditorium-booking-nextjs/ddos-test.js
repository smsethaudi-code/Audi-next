#!/usr/bin/env node

/**
 * DDoS Attack Simulation Script
 * Tests the DDoS protection system by sending multiple requests
 * 
 * Usage: node ddos-test.js [url] [requests] [concurrent]
 * Example: node ddos-test.js http://localhost:3000/api/test-ddos 50 10
 */

const http = require('http')
const https = require('https')
const url = require('url')

// Configuration
const TARGET_URL = process.argv[2] || 'http://localhost:3000/api/test-ddos'
const TOTAL_REQUESTS = parseInt(process.argv[3]) || 50
const CONCURRENT_REQUESTS = parseInt(process.argv[4]) || 10
const REQUEST_DELAY = 100 // ms between batches

// Statistics
let stats = {
  total: 0,
  success: 0,
  blocked: 0,
  error: 0,
  startTime: Date.now()
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function makeRequest(requestId) {
  return new Promise((resolve) => {
    const targetUrl = url.parse(TARGET_URL)
    const client = targetUrl.protocol === 'https:' ? https : http
    
    const options = {
      hostname: targetUrl.hostname,
      port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
      path: targetUrl.path,
      method: 'GET',
      headers: {
        'User-Agent': `DDosTest-${requestId}`,
        'Accept': 'application/json',
        'Connection': 'close'
      }
    }

    const startTime = Date.now()
    
    const req = client.request(options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        const duration = Date.now() - startTime
        stats.total++
        
        if (res.statusCode === 200) {
          stats.success++
          colorLog('green', `✓ Request ${requestId}: SUCCESS (${res.statusCode}) - ${duration}ms`)
        } else if (res.statusCode === 429) {
          stats.blocked++
          colorLog('yellow', `⚠ Request ${requestId}: BLOCKED (${res.statusCode}) - ${duration}ms`)
          try {
            const response = JSON.parse(data)
            if (response.retryAfter) {
              colorLog('cyan', `  → Retry after: ${response.retryAfter}s`)
            }
          } catch (e) {
            // Ignore parsing errors
          }
        } else {
          stats.error++
          colorLog('red', `✗ Request ${requestId}: ERROR (${res.statusCode}) - ${duration}ms`)
        }
        
        resolve()
      })
    })
    
    req.on('error', (err) => {
      stats.total++
      stats.error++
      const duration = Date.now() - startTime
      colorLog('red', `✗ Request ${requestId}: NETWORK ERROR - ${duration}ms - ${err.message}`)
      resolve()
    })
    
    req.setTimeout(5000, () => {
      stats.total++
      stats.error++
      colorLog('red', `✗ Request ${requestId}: TIMEOUT`)
      req.destroy()
      resolve()
    })
    
    req.end()
  })
}

async function runAttackSimulation() {
  colorLog('blue', '🚀 Starting DDoS Attack Simulation')
  colorLog('cyan', `Target: ${TARGET_URL}`)
  colorLog('cyan', `Total Requests: ${TOTAL_REQUESTS}`)
  colorLog('cyan', `Concurrent: ${CONCURRENT_REQUESTS}`)
  console.log('')
  
  const batches = Math.ceil(TOTAL_REQUESTS / CONCURRENT_REQUESTS)
  
  for (let batch = 0; batch < batches; batch++) {
    const batchStart = batch * CONCURRENT_REQUESTS
    const batchEnd = Math.min(batchStart + CONCURRENT_REQUESTS, TOTAL_REQUESTS)
    const batchSize = batchEnd - batchStart
    
    colorLog('blue', `📦 Batch ${batch + 1}/${batches}: Sending ${batchSize} requests...`)
    
    const promises = []
    for (let i = batchStart; i < batchEnd; i++) {
      promises.push(makeRequest(i + 1))
    }
    
    await Promise.all(promises)
    
    // Small delay between batches
    if (batch < batches - 1) {
      await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY))
    }
  }
  
  // Final statistics
  const totalTime = Date.now() - stats.startTime
  console.log('')
  colorLog('blue', '📊 Attack Simulation Complete!')
  console.log('')
  colorLog('green', `✓ Successful: ${stats.success}/${stats.total} (${(stats.success/stats.total*100).toFixed(1)}%)`)
  colorLog('yellow', `⚠ Blocked: ${stats.blocked}/${stats.total} (${(stats.blocked/stats.total*100).toFixed(1)}%)`)
  colorLog('red', `✗ Errors: ${stats.error}/${stats.total} (${(stats.error/stats.total*100).toFixed(1)}%)`)
  console.log('')
  colorLog('cyan', `Total Time: ${(totalTime/1000).toFixed(2)}s`)
  colorLog('cyan', `Requests/sec: ${(stats.total/(totalTime/1000)).toFixed(2)}`)
  console.log('')
  
  if (stats.blocked > 0) {
    colorLog('green', '🛡️  DDoS Protection is WORKING! Requests were blocked.')
  } else {
    colorLog('yellow', '⚠️  No requests were blocked. Check DDoS protection settings.')
  }
}

// Start the simulation
runAttackSimulation().catch(console.error)