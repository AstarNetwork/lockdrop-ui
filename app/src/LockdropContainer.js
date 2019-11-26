import LockdropComponent from './LockdropComponent'
import { drizzleConnect } from 'drizzle-react'

const mapStateToProps = state => ({
  accounts: state.accounts,
  drizzleStatus: state.drizzleStatus
})

const LockdropContainer = drizzleConnect(
  LockdropComponent,
  mapStateToProps
)

export default LockdropContainer 
