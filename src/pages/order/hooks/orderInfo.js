
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { diffModuleJump, padZero } from '@utils'
import { Dialog } from 'vant'

// 按照惯例，组合式函数名以“use”开头
export function useOrderInfo () {
  const router = useRouter()
  const remainTime = ref(0)
  const minusTime = reactive({
    minutes: '',
    seconds: '',
    showTime: false
  })
  const timeShowDetail = (time) => {
    const minutes = padZero(Math.floor(time / 1000 / 60 % 60))
    const seconds = padZero(Math.floor(time / 1000 % 60))
    return {
      minutes,
      seconds
    }
  }
  // 计算订单剩余时间
  const countRemainTime = (time = 0) => {
    remainTime.value = time - Date.now()
    // [note] 控制时间兜底
    if (remainTime.value > 0) {
      const timer = setInterval(() => {
        if (remainTime.value < 1000) {
          clearInterval(timer)
          location.reload()
        } else {
          remainTime.value = remainTime.value - 1000
          Object.assign(minusTime, timeShowDetail(remainTime.value))
          minusTime.showTime = true
        }
      }, 1000)
    }
  }

  /**
   * 计算送达时间
   * @param sendCostTime 配送预计花费时间
   * @returns {string}
   */
  const calcSendTime = (sendCostTime = 0) => {
    const targetTime = new Date(Date.now() + sendCostTime * 60 * 1000)
    return `${padZero(targetTime.getHours())}:${padZero(targetTime.getMinutes())}`
  }

  // 统一处理err
  const handleErr = (err) => {
    if (!err) return new Error('请传入错误信息')
    const { code, msg, data } = err.data
    Dialog.alert({
      message: msg,
      theme: 'round-button'
    }).then(() => {
      // 20003 购物袋15分钟redis缓存已失效
      // 20004 余额不足，支付失败
      // 20005 查无此订单
      if (code === 20003 || code === 20005) {
        diffModuleJump('/home', '', 'home', true)
      } else if (code === 20004) {
        const { orderNum } = data
        jumpOrderDetail(orderNum)
      }
    })
  }

  const jumpOrderDetail = (orderNum) => {
    router.replace({
      path: '/order/orderDetail',
      query: {
        orderNum
      }
    })
  }

  return {
    handleErr,
    minusTime,
    calcSendTime,
    countRemainTime,
    jumpOrderDetail
  }
}
