import renderer from 'react-test-renderer'
import { ImagePicker } from '../ImagePicker'

it('renders correctly', () => {
  const tree = renderer.create(<ImagePicker />).toJSON()
  expect(tree).toMatchSnapshot()
})